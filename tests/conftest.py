import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
    # Arrange: snapshot mutable in-memory state to keep tests isolated.
    original_activities = copy.deepcopy(activities)

    with TestClient(app) as test_client:
        yield test_client

    # Assert/cleanup: restore original state after each test.
    activities.clear()
    activities.update(original_activities)