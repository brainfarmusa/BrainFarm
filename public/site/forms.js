(function () {
  "use strict";
  var SUPABASE_URL = "https://nmqlpthencvxhmkhvgzq.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IrHSWmkDcqgOkudqke4wCw_z5Zo2uKL";
  var ENDPOINT = SUPABASE_URL + "/functions/v1/submit-inquiry";
  var MAX_FILES = 5;
  var MAX_FILE_SIZE = 10 * 1024 * 1024;

  function setStatus(form, message, state) {
    var status = form.querySelector("[data-form-status]");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state || "";
  }

  document.querySelectorAll("[data-inquiry-form]").forEach(function (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      var files = Array.from(form.querySelector('input[type="file"]')?.files || []);
      if (files.length > MAX_FILES) return setStatus(form, "Please attach no more than five files.", "error");
      if (files.some(function (file) { return file.size > MAX_FILE_SIZE; })) return setStatus(form, "Each attachment must be 10MB or smaller.", "error");

      var button = form.querySelector("[type=submit]");
      var originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Submitting…";
      setStatus(form, files.length ? "Securely uploading your files…" : "Securely sending your request…", "working");
      try {
        var response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Authorization": "Bearer " + SUPABASE_PUBLISHABLE_KEY, "apikey": SUPABASE_PUBLISHABLE_KEY },
          body: new FormData(form)
        });
        var result = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(result.error || "The request could not be submitted.");
        form.reset();
        setStatus(form, "Thank you. Your request was received. Reference: " + result.reference, "success");
      } catch (error) {
        setStatus(form, error.message || "We could not submit your request. Please try again.", "error");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
})();
