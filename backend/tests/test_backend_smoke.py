import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select

from app.base import Base
from app.database import SessionLocal, engine
from app.main import app
from app.models import Conversation, IntentLog, ProductClick, Session as DBSession
from app.schemas import Budget, EdibleProduct, ExtractedIntent, Occasion, Urgency
from app.services.curation_service import sanitize_concierge_reply


def _dummy_catalog() -> list[EdibleProduct]:
    return [
        EdibleProduct(
            sku="ABC-123",
            name="Fresh Fruit Bouquet",
            price=39.99,
            image_url="https://example.test/img1.jpg",
            description="A fresh assortment of fruit.",
            tags=["fruit", "birthday"],
            pdp_url="https://example.test/p/abc-123",
        ),
        EdibleProduct(
            sku="CHOCO-9",
            name="Chocolate Dipped Strawberries",
            price=29.99,
            image_url="https://example.test/img2.jpg",
            description="Strawberries dipped in chocolate.",
            tags=["chocolate"],
            pdp_url="https://example.test/p/choco-9",
        ),
        EdibleProduct(
            sku="SYMP-77",
            name="Sympathy Fruit Basket",
            price=54.5,
            image_url="https://example.test/img3.jpg",
            description="A thoughtful fruit basket.",
            tags=["sympathy", "fruit"],
            pdp_url="https://example.test/p/symp-77",
        ),
    ]


class ReplyFormattingTests(unittest.TestCase):
    def test_sanitize_concierge_reply_removes_markdown_and_list_markers(self) -> None:
        raw = (
            "5. **Bobbi's Berry Box Gift Set (SKU: 9390-heart)** - A fun and sweet gift.\n"
            "Let me know if you'd like more details on any of these, or if none of these feel right."
        )
        cleaned = sanitize_concierge_reply(raw)

        self.assertNotIn("*", cleaned)
        first_line = cleaned.splitlines()[0]
        self.assertFalse(first_line.startswith("5."))
        self.assertTrue(first_line.startswith("Bobbi's Berry Box Gift Set (SKU: 9390-heart)"))


class BackendNoDBSmokeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()

    def test_health(self) -> None:
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "healthy"})

    def test_search_returns_stubbed_products(self) -> None:
        dummy = _dummy_catalog()[:2]
        with patch("app.routers.search.search_products", return_value=dummy):
            res = self.client.post("/api/search", json={"keyword": "fruit"})

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["sku"], "ABC-123")


class BackendDBSmokeTests(unittest.TestCase):
    _db_init_error: Exception | None = None

    @classmethod
    def setUpClass(cls) -> None:
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as exc:
            cls._db_init_error = exc

    def setUp(self) -> None:
        if self.__class__._db_init_error:
            raise unittest.SkipTest(f"DB unavailable: {self.__class__._db_init_error}")
        self.client = TestClient(app)

    def tearDown(self) -> None:
        if hasattr(self, "client"):
            self.client.close()

    def _cleanup_session(self, session_id: str) -> None:
        db = SessionLocal()
        try:
            # Some SQLite schemas (e.g. created via Alembic) may not include
            # ON DELETE CASCADE, so remove children explicitly first.
            db.execute(delete(ProductClick).where(ProductClick.session_id == session_id))
            db.execute(delete(IntentLog).where(IntentLog.session_id == session_id))
            db.execute(delete(Conversation).where(Conversation.session_id == session_id))
            db.execute(delete(DBSession).where(DBSession.id == session_id))
            db.commit()
        finally:
            db.close()

    def test_db_connection(self) -> None:
        if self.__class__._db_init_error:
            self.fail(f"DB schema init failed: {self.__class__._db_init_error}")
        self.assertTrue(True)

    def test_chat_clarification_flow_persists_session_and_logs(self) -> None:
        intent = ExtractedIntent(
            occasion=None,
            urgency=None,
            recipient=None,
            budget=None,
            dietary=[],
            keywords=[],
            needs_clarification=True,
            clarifying_question="What’s the occasion?",
            confidence=0.2,
        )

        with patch("app.routers.chat.extract_intent", return_value=intent):
            res = self.client.post("/api/chat", json={"message": "Need a gift", "history": []})

        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["reply"], "What’s the occasion?")
        self.assertEqual(body["products"], [])
        self.assertTrue(body["intent"]["needs_clarification"])

        session_id = body["session_id"]
        self.assertIsInstance(session_id, str)
        self.assertGreater(len(session_id), 0)

        try:
            db = SessionLocal()
            try:
                conv_count = (
                    db.execute(
                        select(func.count())
                        .select_from(Conversation)
                        .where(Conversation.session_id == session_id)
                    )
                ).scalar_one()
                intent_count = (
                    db.execute(
                        select(func.count())
                        .select_from(IntentLog)
                        .where(IntentLog.session_id == session_id)
                    )
                ).scalar_one()
            finally:
                db.close()

            self.assertEqual(conv_count, 2, "Expected user + assistant conversation rows")
            self.assertEqual(intent_count, 1, "Expected an intent log row")
        finally:
            self._cleanup_session(session_id)

    def test_chat_recommendation_flow_uses_stubbed_search_and_curation(self) -> None:
        dummy_products = _dummy_catalog()
        curated = dummy_products[:2]
        intent = ExtractedIntent(
            occasion=Occasion.birthday,
            urgency=Urgency.flexible,
            recipient="my friend",
            budget=Budget.mid,
            dietary=[],
            keywords=["birthday", "fruit"],
            needs_clarification=False,
            clarifying_question=None,
            confidence=0.85,
        )

        with (
            patch("app.routers.chat.extract_intent", return_value=intent),
            patch("app.routers.chat.search_products", return_value=dummy_products),
            patch("app.routers.chat.curate_products", return_value=("Here are a few great options:", curated)),
        ):
            res = self.client.post("/api/chat", json={"message": "Birthday gift", "history": []})

        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["reply"], "Here are a few great options:")
        self.assertEqual([p["sku"] for p in body["products"]], [p.sku for p in curated])

        self._cleanup_session(body["session_id"])

    def test_analytics_click_404_without_session(self) -> None:
        res = self.client.post(
            "/api/analytics/click",
            json={
                "session_id": "does-not-exist",
                "sku": "ABC-123",
                "name": "Fresh Fruit Bouquet",
                "position": 1,
            },
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json().get("detail"), "Session not found")

    def test_analytics_click_persists_click_row(self) -> None:
        db = SessionLocal()
        try:
            session = DBSession()
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        finally:
            db.close()

        try:
            res = self.client.post(
                "/api/analytics/click",
                json={
                    "session_id": session_id,
                    "sku": "ABC-123",
                    "name": "Fresh Fruit Bouquet",
                    "position": 2,
                },
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json(), {"status": "ok"})

            db = SessionLocal()
            try:
                click_count = (
                    db.execute(
                        select(func.count())
                        .select_from(ProductClick)
                        .where(ProductClick.session_id == session_id)
                    )
                ).scalar_one()
            finally:
                db.close()

            self.assertEqual(click_count, 1)
        finally:
            self._cleanup_session(session_id)

    def test_analytics_convert_sets_converted_flag(self) -> None:
        db = SessionLocal()
        try:
            session = DBSession()
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        finally:
            db.close()

        try:
            res = self.client.post("/api/analytics/convert", json={"session_id": session_id})
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json(), {"status": "ok"})

            db = SessionLocal()
            try:
                refreshed = db.get(DBSession, session_id)
                self.assertIsNotNone(refreshed)
                self.assertTrue(refreshed.converted)
            finally:
                db.close()
        finally:
            self._cleanup_session(session_id)
