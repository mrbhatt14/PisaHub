// Shared confirm/prompt dialog. Replaces native confirm()/prompt() everywhere in the admin so an
// "are you sure?" matches the app's own look instead of a bare browser dialog. Every call site just
// awaits the same way it used to call the native function - admConfirm() resolves true/false,
// admPrompt() resolves the typed string or null (cancelled), exactly like confirm()/prompt() did.
const admDlg = (id) => document.getElementById(id);

function openAdmDialog({ message, danger, confirmText, cancelText, input, defaultValue, placeholder, validate }) {
  return new Promise((resolve) => {
    const backdrop = admDlg("admDialogBackdrop");
    const msgEl = admDlg("admDialogMessage");
    const inputWrap = admDlg("admDialogInputWrap");
    const inputEl = admDlg("admDialogInput");
    const errEl = admDlg("admDialogError");
    const okBtn = admDlg("admDialogConfirm");
    const cancelBtn = admDlg("admDialogCancel");

    msgEl.textContent = message;
    errEl.textContent = "";
    okBtn.textContent = confirmText || (input ? "OK" : "Confirm");
    okBtn.className = "admin-btn" + (danger ? " admin-btn--danger" : "");
    cancelBtn.textContent = cancelText || "Cancel";
    inputWrap.classList.toggle("admin-hidden", !input);
    inputEl.value = input ? defaultValue || "" : "";
    inputEl.placeholder = placeholder || "";

    backdrop.classList.remove("admin-hidden");
    (input ? inputEl : okBtn).focus();
    if (input) inputEl.select();

    const cleanup = () => {
      backdrop.classList.add("admin-hidden");
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      inputEl.removeEventListener("keydown", onKeydown);
    };
    const onOk = () => {
      if (input) {
        const val = inputEl.value;
        const problem = validate && validate(val);
        if (problem) {
          errEl.textContent = problem;
          return;
        }
        cleanup();
        resolve(val);
      } else {
        cleanup();
        resolve(true);
      }
    };
    const onCancel = () => {
      cleanup();
      resolve(input ? null : false);
    };
    const onKeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onOk();
      }
    };

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    inputEl.addEventListener("keydown", onKeydown);
  });
}

// Yes/no. `danger: true` styles the confirm button red, for destructive actions (delete/reject).
function admConfirm(message, { danger = false, confirmText, cancelText } = {}) {
  return openAdmDialog({ message, danger, confirmText, cancelText, input: false });
}

// Single line of text. `validate(value)` returns an error string to block submission, or falsy to allow it.
function admPrompt(message, defaultValue = "", { placeholder, validate, confirmText, cancelText } = {}) {
  return openAdmDialog({ message, input: true, defaultValue, placeholder, validate, confirmText, cancelText });
}
