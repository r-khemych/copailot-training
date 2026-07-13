document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("email-error");

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function extractErrorMessage(payload, fallbackText) {
    if (!payload) {
      return fallbackText;
    }

    if (typeof payload.detail === "string") {
      return payload.detail;
    }

    if (Array.isArray(payload.detail)) {
      const validationMessages = payload.detail
        .map((item) => item.msg)
        .filter(Boolean);

      if (validationMessages.length > 0) {
        return validationMessages.join("; ");
      }
    }

    if (typeof payload.message === "string") {
      return payload.message;
    }

    return fallbackText;
  }

  function extractFieldError(payload, fieldName) {
    if (!payload || !Array.isArray(payload.detail)) {
      return null;
    }

    const fieldError = payload.detail.find(
      (item) => Array.isArray(item.loc) && item.loc.includes(fieldName) && typeof item.msg === "string"
    );

    return fieldError ? fieldError.msg : null;
  }

  function clearEmailError() {
    emailError.textContent = "";
    emailError.classList.add("hidden");
    emailInput.removeAttribute("aria-invalid");
  }

  function setEmailError(message) {
    emailError.textContent = message;
    emailError.classList.remove("hidden");
    emailInput.setAttribute("aria-invalid", "true");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML = details.participants.length > 0
          ? `<ul class="participants-list">${details.participants.map(p => `<li><span class="participant-email">${p}</span><button class="delete-btn" data-email="${p}" data-activity="${name}" title="Unregister">&#x1F5D1;</button></li>`).join("")}</ul>`
          : `<p class="no-participants">No participants yet — be the first!</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-heading">Signed Up</p>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add delete handlers for participant buttons
        activityCard.querySelectorAll(".delete-btn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const email = btn.dataset.email;
            const activity = btn.dataset.activity;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              if (response.ok) {
                await fetchActivities();
                const result = await response.json();
                showMessage(result.message || "Participant unregistered.", "success");
              } else {
                const result = await response.json();
                showMessage(extractErrorMessage(result, "Failed to unregister participant."), "error");
              }
            } catch (error) {
              showMessage("Network error while unregistering participant.", "error");
              console.error("Error unregistering:", error);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearEmailError();

    const email = emailInput.value.trim();
    const activity = document.getElementById("activity").value;

    emailInput.value = email;

    if (!email) {
      setEmailError("Email is required.");
      emailInput.focus();
      return;
    }

    if (!emailInput.checkValidity()) {
      setEmailError("Please enter a valid email address.");
      emailInput.focus();
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message || "Signup completed.", "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        const emailFieldError = extractFieldError(result, "email");
        if (emailFieldError) {
          setEmailError(emailFieldError);
          emailInput.focus();
          return;
        }

        showMessage(extractErrorMessage(result, "Failed to sign up."), "error");
      }
    } catch (error) {
      showMessage("Network error while signing up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
