const form = document.getElementById('formProduto');
const container = document.getElementById('container-produtos');

// Variável global para armazenar os itens do carrinho
let carrinho = [];

// --- LOGOUT ---
function logout() {
    localStorage.removeItem("usuarioTipo");
    window.location.href = "../index.html";
}

// --- SISTEMA DE NOTIFICAÇÕES (SWEETALERT2) ---
const confirmarAcao = async (title, text, icon) => {
    return await Swal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonColor: '#212529',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, confirmar!',
        cancelButtonText: 'Cancelar',
        background: '#fff', 
        color: '#212529'
    });
};

const toast = (title, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
};

// --- CONTROLE DE ACESSO (ADMIN-ONLY) ---
document.addEventListener('DOMContentLoaded', () => {
    const nivelUsuario = localStorage.getItem('usuarioTipo');

    if (nivelUsuario === 'admin') {
        const elementosPrivados = document.querySelectorAll('.admin-only');
        elementosPrivados.forEach(el => {
            el.classList.remove('admin-only'); 
        });
        console.log("Modo Administrador Ativado.");
    }
    
    // Inicializa o modal de edição
    const modalEl = document.getElementById('modalEditarProduto');
    if (modalEl) {
        modalEditar = new bootstrap.Modal(modalEl);
    }
});

// --- GESTÃO DE PRODUTOS ---

// Carregamento do catálogo
async function carregarCatalogo() {
    try {
        const response = await fetch('https://magazine-pedro.onrender.com/produtos');
        const produtos = await response.json();
        
        container.innerHTML = ''; 
        const nivelUsuario = localStorage.getItem('usuarioTipo');

        produtos.forEach(produto => {
            const precoFormatado = parseFloat(produto.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            let botoesAcao = '';

            if (nivelUsuario === 'admin') {
                botoesAcao = `
                    <div class="d-flex gap-2">
                        <button onclick="excluirProduto(${produto.id})" class="btn btn-delete w-50">Excluir</button>
                        <button onclick="editarProduto(${produto.id})" class="btn btn-edit w-50">Editar</button>
                    </div>`;
            } else {
                // Passa os dados do produto para a função comprarProduto
                botoesAcao = `
                    <button onclick="comprarProduto(${produto.id}, '${produto.nome}', ${produto.preco}, '${produto.imagem_url}')" class="btn btn-dark w-100">
                        Comprar agora
                    </button>`;
            }

            container.innerHTML += `
                <div class="col-12 col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <img src="http://localhost:3000/${produto.imagem_url}" class="card-img-top" alt="${produto.nome}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title text-uppercase">${produto.nome}</h5>
                            <p class="fw-bold text-dark fs-5">${precoFormatado}</p>
                            ${botoesAcao} 
                        </div>
                    </div>
                </div>`;
        });
    } catch (error) {                                                        
        console.error("Erro ao carregar catálogo:", error);
    }
}

// Salvar novos produtos
form.addEventListener('submit', async (event) => {
    event.preventDefault(); 

    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('preco', document.getElementById('preco').value);
    
    const inputImagem = document.getElementById('imagem_arquivo'); 
    if (inputImagem.files.length > 0) {
        formData.append('imagem_arquivo', inputImagem.files[0]);
    }

    try {
        const response = await fetch('https://magazine-pedro.onrender.com/produtos', {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            toast("Produto adicionado com sucesso!");
            form.reset(); 
            
            const collapseElement = document.getElementById('collapseForm');
            const bsCollapse = bootstrap.Collapse.getInstance(collapseElement) || new bootstrap.Collapse(collapseElement);
            bsCollapse.hide();

            carregarCatalogo(); 
        } else {
            toast("Erro ao salvar produto.", "error");
        }
    } catch (error) {
        console.error("Erro no envio:", error);
    }
});

// Exclusão de produto
async function excluirProduto(id) {
    const resultado = await confirmarAcao("Remoção", "Esta ação é permanente!", "warning");

    if(resultado.isConfirmed) {
        try {
            const response = await fetch(`https://magazine-pedro.onrender.com/produtos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast("Produto removido!");
                carregarCatalogo();
            } else {
                toast('Não foi possível excluir.', 'error');
            }
        } catch (error) {
            toast('Falha na conexão.', 'error');
        }
    }
}

// --- EDIÇÃO DE PRODUTO ---
let modalEditar;

async function editarProduto(id) {
    const resultado = await confirmarAcao("Edição", "Deseja abrir o formulário de edição?", "question");

    if(resultado.isConfirmed) {
        try {
            const response = await fetch(`https://magazine-pedro.onrender.com/produtos`);
            const produtos = await response.json();
            const produtoEncontrado = produtos.find(p => p.id === id);

            if (produtoEncontrado) {
                document.getElementById('edit-id').value = produtoEncontrado.id;
                document.getElementById('edit-nome').value = produtoEncontrado.nome;
                document.getElementById('edit-preco').value = produtoEncontrado.preco;

                modalEditar.show();
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    }
}

document.getElementById('formEditarProduto').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const id = document.getElementById('edit-id').value;
    const dadosAtualizados = {
        nome: document.getElementById('edit-nome').value,
        preco: document.getElementById('edit-preco').value
    };

    try {
        const response = await fetch(`https://magazine-pedro.onrender.com/produtos/${id}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosAtualizados)
        });

        if (response.ok) {
            toast('Produto editado com sucesso!');
            modalEditar.hide();
            carregarCatalogo();
        } else {
            toast("Erro ao atualizar no servidor.", "error");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        toast("Erro de conexão.", "error");
    }
});

// --- LÓGICA DO CARRINHO ---

// Adiciona o item ao array e atualiza a interface
function comprarProduto(id, nome, preco, imagem) {
    const item = { id, nome, preco, imagem };
    carrinho.push(item);
    atualizarCarrinho();
    toast(`${nome} adicionado ao carrinho!`);
}

function atualizarCarrinho() {
    const lista = document.getElementById('itens-carrinho');
    const badge = document.getElementById('carrinho-badge');
    const totalElement = document.getElementById('total-carrinho');
    
    lista.innerHTML = '';
    
    if (carrinho.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted">Seu carrinho está vazio.</p>';
        badge.classList.add('d-none');
        totalElement.innerText = 'R$ 0,00';
    } else {
        badge.classList.remove('d-none');
        badge.innerText = carrinho.length;
        
        let total = 0;

        carrinho.forEach((item, index) => {
            total += parseFloat(item.preco);
            
            lista.innerHTML += `
                <div class="card mb-3 border-0 shadow-sm">
                    <div class="row g-0 align-items-center p-2">
                        <div class="col-4">
                            <img src="http://localhost:3000/${item.imagem}" class="img-fluid rounded" alt="${item.nome}">
                        </div>
                        <div class="col-8">
                            <div class="card-body py-0">
                                <h6 class="card-title mb-1" style="font-size: 0.9rem;">${item.nome}</h6>
                                <p class="card-text fw-bold mb-1">R$ ${parseFloat(item.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <button onclick="removerDoCarrinho(${index})" class="btn btn-comprar text-white p-2" style="font-size: 0.8rem;">Remover</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
        
        totalElement.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

// Seleciona o botão e o elemento do carrinho
const btnCarrinhoContainer = document.querySelector('.position-fixed.top-0.end-0');
const offcanvasCarrinho = document.getElementById('carrinhoLateral');

// Quando o carrinho COMEÇAR a abrir, esconde o botão
offcanvasCarrinho.addEventListener('show.bs.offcanvas', () => {
    btnCarrinhoContainer.classList.add('d-none');
});

// Quando o carrinho terminar de FECHAR, mostra o botão de volta
offcanvasCarrinho.addEventListener('hidden.bs.offcanvas', () => {
    btnCarrinhoContainer.classList.remove('d-none');
});

// Inicializa o catálogo ao carregar a página
window.onload = carregarCatalogo;