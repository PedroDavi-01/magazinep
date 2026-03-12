document.getElementById("btnEntrar").addEventListener("click", async (e) => {

  e.preventDefault();

const toast = (title, icon = "success") => { 
        const Toast = Swal.mixin({
            toast: true,
            position: "top",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });

        return Toast.fire({
            icon: icon,
            title: title
        });
    }


  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;
  const checkPrivacy = document.getElementById("checkPrivacy");

  // validações de  aceitação dos termos

  if(!checkPrivacy.checked) {
    toast("Aceite nossos termos de privacidade", "warning");
    return;
  }

  try {
  
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha})
  });

  // login realizado com sucesso

  if(response.ok) {
    const dados = await response.json(); // Aqui pegamos o 'tipo' vindo do servidor

    // SALVAMOS O TIPO NO NAVEGADOR
    localStorage.setItem('usuarioTipo', dados.tipo);

    toast("Login realizado com sucesso!").then(() => {
      window.location.href = "pages/home.html";
    });
  } else {
    toast("Email ou senha incorretos", "error")
  }
} catch (error) {
  console.log(Error, "houve um erro de login no servidor")
}

})