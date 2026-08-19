(function () {
  "use strict";

  document.querySelectorAll("[data-mail-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var rows = [];
      new FormData(form).forEach(function (value, key) {
        var cleanValue = String(value).trim();
        if (cleanValue) rows.push(key + ":\n" + cleanValue);
      });

      var subject = form.getAttribute("data-mail-subject") || "BrainFarm USA Website Inquiry";
      var body = "BrainFarm USA website inquiry\n\n" + rows.join("\n\n");
      var status = form.querySelector("[data-form-status]");
      if (status) status.textContent = "Opening your email application. Review the request and press Send.";
      window.location.href = "mailto:Darrell@brainfarmusa.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  });
})();
