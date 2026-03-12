// Selecionamos o formulário em vez do botão
document.getElementById("formCadastro").addEventListener("submit", async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    const toast = (title, icon = "success") => { 
        const Toast = Swal.mixin({
            toast: true,
            position: "top",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        return Toast.fire({ icon: icon, title: title });
    }

    const email = document.getElementById("cadEmail").value;
    const senha = document.getElementById("cadSenha").value;
    const confirmaSenha = document.getElementById("cadConfirmaSenha").value;
    const checkPrivacy = document.getElementById("checkPrivacy");

    // Validações
    if(senha !== confirmaSenha) {
        toast("Senhas não conferem", "warning");
        return;
    }

    if(!checkPrivacy.checked) {
        toast("Aceite nossos termos de privacidade", "warning");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/cadastro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (response.ok) {
            toast("Cadastro realizado com sucesso!").then(() => {
                window.location.href = "../index.html"; // Redireciona para o login
            });
        } else {
            const result = await response.json();
            toast(result.error || "Falha no cadastro", "error");
        }
    } catch (error) {
        console.error("Erro no servidor:", error);
        toast("Não foi possível conectar ao servidor", "error");
    }
});