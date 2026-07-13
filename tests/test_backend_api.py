from urllib.parse import quote

from src.app import activities


def _activity_signup_path(activity_name: str) -> str:
    return f"/activities/{quote(activity_name, safe='')}/signup"


def test_get_activities_returns_activity_map(client):
    # Arrange
    expected_activity = "Chess Club"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, dict)
    assert expected_activity in body
    assert "participants" in body[expected_activity]


def test_signup_success_adds_participant(client):
    # Arrange
    activity_name = "Chess Club"
    new_email = "new.student@mergington.edu"

    # Act
    response = client.post(
        _activity_signup_path(activity_name),
        params={"email": new_email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {new_email} for {activity_name}"
    assert new_email in activities[activity_name]["participants"]


def test_signup_unknown_activity_returns_404(client):
    # Arrange
    unknown_activity = "Unknown Club"

    # Act
    response = client.post(
        _activity_signup_path(unknown_activity),
        params={"email": "student@mergington.edu"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_duplicate_returns_400(client):
    # Arrange
    activity_name = "Chess Club"
    existing_email = activities[activity_name]["participants"][0]

    # Act
    response = client.post(
        _activity_signup_path(activity_name),
        params={"email": existing_email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_invalid_email_returns_422(client):
    # Arrange
    activity_name = "Chess Club"
    invalid_email = "not-an-email"

    # Act
    response = client.post(
        _activity_signup_path(activity_name),
        params={"email": invalid_email},
    )

    # Assert
    assert response.status_code == 422


def test_unregister_success_removes_participant(client):
    # Arrange
    activity_name = "Chess Club"
    existing_email = activities[activity_name]["participants"][0]

    # Act
    response = client.delete(
        _activity_signup_path(activity_name),
        params={"email": existing_email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {existing_email} from {activity_name}"
    assert existing_email not in activities[activity_name]["participants"]


def test_unregister_unknown_activity_returns_404(client):
    # Arrange
    unknown_activity = "Unknown Club"

    # Act
    response = client.delete(
        _activity_signup_path(unknown_activity),
        params={"email": "student@mergington.edu"},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_not_signed_up_returns_400(client):
    # Arrange
    activity_name = "Chess Club"
    missing_email = "missing.student@mergington.edu"
    assert missing_email not in activities[activity_name]["participants"]

    # Act
    response = client.delete(
        _activity_signup_path(activity_name),
        params={"email": missing_email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_unregister_invalid_email_returns_422(client):
    # Arrange
    activity_name = "Chess Club"
    invalid_email = "not-an-email"

    # Act
    response = client.delete(
        _activity_signup_path(activity_name),
        params={"email": invalid_email},
    )

    # Assert
    assert response.status_code == 422