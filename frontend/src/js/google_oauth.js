document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("googleLoginBtn");
    const registerBtn = document.getElementById("googleRegisterBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = "/api/auth/googlelogin";
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            window.location.href = "/api/auth/googlelogin";
        });
    }
});
