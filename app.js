// app.js
import { InventoryDB } from './db.js';
import { formatarData, downloadCSV, readFileAsText } from './utils.js';

const db = new InventoryDB();

let state = {
    unidades: [],
    equipamentos: [],
    inventario: []
};

document.addEventListener('DOMContentLoaded', async function() {
    await carregarDados();
    configurarEventListeners();
});

async function carregarDados() {
    try {
        state.unidades = await db.getUnidades();
        state.equipamentos = await db.getEquipamentos();
        state.inventario = await db.getInventario();

        atualizarDashboard();
        atualizarTabelaUnidades();
        atualizarTabelaEquipamentos();
        atualizarTabelaInventario();
        popularSelects();
        gerarRelatorioGeral();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
    }
}

function popularSelects() {
    const selects = [
        document.getElementById('inventario-unidade'),
        document.getElementById('pesquisa-unidade'),
        document.getElementById('select-unidade-relatorio')
    ];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Selecione uma unidade</option>';
            state.unidades.forEach(unidade => {
                select.innerHTML += `<option value="${unidade.ID}">${unidade.Nome}</option>`;
            });
        }
    });

    const selectEquipamento = document.getElementById('inventario-equipamento');
    if (selectEquipamento) {
        selectEquipamento.innerHTML = '<option value="">Selecione um equipamento</option>';
        state.equipamentos.forEach(equipamento => {
            selectEquipamento.innerHTML += `<option value="${equipamento.ID}">${equipamento.Descricao}</option>`;
        });
    }
}

function atualizarDashboard() {
    document.getElementById('total-unidades').textContent = state.unidades.length;
    document.getElementById('total-equipamentos').textContent = state.equipamentos.length;
    document.getElementById('total-inventario').textContent = state.inventario.length;

    const ultimosItens = state.inventario
        .sort((a, b) => new Date(b.DataCadastro) - new Date(a.DataCadastro))
        .slice(0, 5);

    const tbody = document.getElementById('ultimos-itens');
    tbody.innerHTML = ultimosItens.map(item => {
        const equipamento = state.equipamentos.find(e => e.ID === item.EquipamentoID) || { Descricao: 'Desconhecido' };
        const unidade = state.unidades.find(u => u.ID === item.UnidadeID) || { Nome: 'Desconhecida' };
        return `
            <tr>
                <td>${equipamento.Descricao}</td>
                <td>${item.Serial || '-'}</td>
                <td>${unidade.Nome}</td>
                <td>${formatarData(item.DataCadastro)}</td>
            </tr>
        `;
    }).join('');
}

function atualizarTabelaUnidades() {
    const tbody = document.getElementById('tabela-unidades');
    if (!tbody) return;
    tbody.innerHTML = state.unidades.map(unidade => `
        <tr>
            <td>${unidade.ID}</td>
            <td>${unidade.SAP}</td>
            <td>${unidade.Nome}</td>
            <td>${unidade.Endereco}</td>
            <td>
                <button class="btn btn-sm btn-warning editar-unidade" data-id="${unidade.ID}">Editar</button>
                <button class="btn btn-sm btn-danger excluir-unidade" data-id="${unidade.ID}">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaEquipamentos() {
    const tbody = document.getElementById('tabela-equipamentos');
    if (!tbody) return;
    tbody.innerHTML = state.equipamentos.map(equipamento => `
        <tr>
            <td>${equipamento.ID}</td>
            <td>${equipamento.Descricao}</td>
            <td>
                <button class="btn btn-sm btn-warning editar-equipamento" data-id="${equipamento.ID}">Editar</button>
                <button class="btn btn-sm btn-danger excluir-equipamento" data-id="${equipamento.ID}">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaInventario() {
    const tbody = document.getElementById('tabela-inventario');
    if (!tbody) return;
    tbody.innerHTML = state.inventario.map(item => {
        const equipamento = state.equipamentos.find(e => e.ID === item.EquipamentoID) || { Descricao: 'Desconhecido' };
        const unidade = state.unidades.find(u => u.ID === item.UnidadeID) || { Nome: 'Desconhecida' };
        return `
            <tr>
                <td>${item.ID}</td>
                <td>${formatarData(item.DataCadastro)}</td>
                <td>${equipamento.Descricao}</td>
                <td>${item.Serial || '-'}</td>
                <td>${item.Patrimonio || '-'}</td>
                <td>${item.IP || '-'}</td>
                <td>${item.Hostname || '-'}</td>
                <td>${item.Processador || '-'}</td>
                <td>${item.MemoriaRAM || '-'}</td>
                <td>${item.TecnologiaRAM || '-'}</td>
                <td>${item.Storage || '-'}</td>
                <td>${unidade.Nome}${item.LocalInstalado ? ` (${item.LocalInstalado})` : ''}</td>
                <td>
                    <button class="btn btn-sm btn-warning editar-inventario" data-id="${item.ID}">Editar</button>
                    <button class="btn btn-sm btn-danger excluir-inventario" data-id="${item.ID}">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

function configurarEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-section')).classList.add('active');
        });
    });

    document.getElementById('btn-salvar-unidade').addEventListener('click', salvarUnidade);
    document.getElementById('btn-salvar-equipamento').addEventListener('click', salvarEquipamento);
    document.getElementById('btn-salvar-inventario').addEventListener('click', salvarInventario);
    document.getElementById('form-pesquisa').addEventListener('submit', realizarPesquisa);
    document.getElementById('btn-backup').addEventListener('click', fazerBackup);
    document.getElementById('btn-restaurar').addEventListener('click', restaurarBackup);
    document.getElementById('select-unidade-relatorio').addEventListener('change', gerarRelatorioUnidade);
    document.getElementById('btn-exportar-geral').addEventListener('click', exportarRelatorioGeral);
    document.getElementById('btn-exportar-unidade').addEventListener('click', exportarRelatorioUnidade);
    
    document.addEventListener('click', async (e) => {
        if (e.target.matches('.editar-unidade')) {
            await editarUnidade(e.target.dataset.id);
        } else if (e.target.matches('.excluir-unidade')) {
            await excluirUnidade(e.target.dataset.id);
        } else if (e.target.matches('.editar-equipamento')) {
            await editarEquipamento(e.target.dataset.id);
        } else if (e.target.matches('.excluir-equipamento')) {
            await excluirEquipamento(e.target.dataset.id);
        } else if (e.target.matches('.editar-inventario')) {
            await editarInventario(e.target.dataset.id);
        } else if (e.target.matches('.excluir-inventario')) {
            await excluirInventario(e.target.dataset.id);
        } else if (e.target.matches('.detalhes-equipamento')) {
            mostrarDetalhesEquipamento(e.target.dataset.equipamento, e.target.dataset.unidade);
        }
    });

    const modais = ['modalUnidade', 'modalEquipamento', 'modalInventario'];
    modais.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', () => {
                let formId;
                if (modalId === 'modalUnidade') formId = 'form-unidade';
                if (modalId === 'modalEquipamento') formId = 'form-equipamento';
                if (modalId === 'modalInventario') formId = 'form-inventario';

                if (formId) {
                    const formElement = document.getElementById(formId);
                    if (formElement) {
                        formElement.reset();
                    }
                }

                // Limpa o campo de ID oculto
                const idFieldId = modalId.replace('modal', '').toLowerCase() + '-id';
                const idElement = document.getElementById(idFieldId);
                if (idElement) {
                    idElement.value = '';
                }
            });
        }
    });
}

async function salvarUnidade() {
    const id = document.getElementById('unidade-id').value;
    const unidade = {
        SAP: document.getElementById('unidade-sap').value.toUpperCase(),
        Nome: document.getElementById('unidade-nome').value.toUpperCase(),
        Endereco: document.getElementById('unidade-endereco').value.toUpperCase()
    };
    
    if (!unidade.SAP || !unidade.Nome || !unidade.Endereco) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    try {
        if (id) {
            await db.updateUnidade(parseInt(id), unidade);
        } else {
            await db.addUnidade(unidade);
        }
        await carregarDados();
        bootstrap.Modal.getInstance(document.getElementById('modalUnidade')).hide();
    } catch (error) {
        console.error('Erro ao salvar unidade:', error);
        alert('Erro ao salvar unidade. Verifique o console para mais detalhes.');
    }
}

async function salvarEquipamento() {
    const id = document.getElementById('equipamento-id').value;
    const descricao = document.getElementById('equipamento-descricao').value.toUpperCase();
    
    if (!descricao) {
        alert('Por favor, preencha a descrição.');
        return;
    }
    
    try {
        if (id) {
            await db.updateEquipamento(parseInt(id), { Descricao: descricao });
        } else {
            await db.addEquipamento({ Descricao: descricao });
        }
        await carregarDados();
        bootstrap.Modal.getInstance(document.getElementById('modalEquipamento')).hide();
    } catch (error) {
        console.error('Erro ao salvar equipamento:', error);
        alert('Erro ao salvar equipamento. Verifique o console para mais detalhes.');
    }
}

async function salvarInventario() {
    const id = document.getElementById('inventario-id').value;
    const item = {
        EquipamentoID: parseInt(document.getElementById('inventario-equipamento').value),
        UnidadeID: parseInt(document.getElementById('inventario-unidade').value),
        Serial: document.getElementById('inventario-serial').value.toUpperCase() || null,
        Patrimonio: document.getElementById('inventario-patrimonio').value.toUpperCase() || null,
        IP: document.getElementById('inventario-ip').value.toUpperCase() || null,
        Hostname: document.getElementById('inventario-hostname').value.toUpperCase() || null,
        LocalInstalado: document.getElementById('inventario-local').value.toUpperCase() || null,
        // Novos campos adicionados
        Processador: document.getElementById('inventario-processador').value.toUpperCase() || null,
        MemoriaRAM: document.getElementById('inventario-memoria-ram').value.toUpperCase() || null,
        TecnologiaRAM: document.getElementById('inventario-tecnologia-ram').value.toUpperCase() || null,
        Storage: document.getElementById('inventario-storage').value.toUpperCase() || null
    };
    
    if (isNaN(item.EquipamentoID) || isNaN(item.UnidadeID)) {
        alert('Por favor, selecione um equipamento e uma unidade.');
        return;
    }

    try {
        if (id) {
            await db.updateInventarioItem(parseInt(id), item);
        } else {
            item.DataCadastro = new Date();
            await db.addInventarioItem(item);
        }
        await carregarDados();
        bootstrap.Modal.getInstance(document.getElementById('modalInventario')).hide();
    } catch (error) {
        console.error('Erro ao salvar item do inventário:', error);
        alert('Erro ao salvar item do inventário. Verifique o console para mais detalhes.');
    }
}

async function editarUnidade(id) {
    try {
        const unidade = state.unidades.find(u => u.ID === parseInt(id));
        if (unidade) {
            document.getElementById('unidade-id').value = unidade.ID;
            document.getElementById('unidade-sap').value = unidade.SAP;
            document.getElementById('unidade-nome').value = unidade.Nome;
            document.getElementById('unidade-endereco').value = unidade.Endereco;
            new bootstrap.Modal(document.getElementById('modalUnidade')).show();
        }
    } catch (error) {
        console.error('Erro ao carregar unidade para edição:', error);
    }
}

async function editarEquipamento(id) {
    try {
        const equipamento = state.equipamentos.find(e => e.ID === parseInt(id));
        if (equipamento) {
            document.getElementById('equipamento-id').value = equipamento.ID;
            document.getElementById('equipamento-descricao').value = equipamento.Descricao;
            new bootstrap.Modal(document.getElementById('modalEquipamento')).show();
        }
    } catch (error) {
        console.error('Erro ao carregar equipamento para edição:', error);
    }
}

async function editarInventario(id) {
    try {
        const item = state.inventario.find(i => i.ID === parseInt(id));
        if (item) {
            document.getElementById('inventario-id').value = item.ID;
            document.getElementById('inventario-equipamento').value = item.EquipamentoID;
            document.getElementById('inventario-unidade').value = item.UnidadeID;
            document.getElementById('inventario-serial').value = item.Serial || '';
            document.getElementById('inventario-patrimonio').value = item.Patrimonio || '';
            document.getElementById('inventario-ip').value = item.IP || '';
            document.getElementById('inventario-hostname').value = item.Hostname || '';
            document.getElementById('inventario-local').value = item.LocalInstalado || '';
             // Novos campos adicionados
            document.getElementById('inventario-processador').value = item.Processador || '';
            document.getElementById('inventario-memoria-ram').value = item.MemoriaRAM || '';
            document.getElementById('inventario-tecnologia-ram').value = item.TecnologiaRAM || '';
            document.getElementById('inventario-storage').value = item.Storage || '';
            
            new bootstrap.Modal(document.getElementById('modalInventario')).show();
        }
    } catch (error) {
        console.error('Erro ao carregar item do inventário para edição:', error);
    }
}

async function excluirUnidade(id) {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;
    try {
        await db.deleteUnidade(parseInt(id));
        await carregarDados();
        alert('Unidade excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir unidade:', error);
        alert(error.message);
    }
}

async function excluirEquipamento(id) {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
    try {
        await db.deleteEquipamento(parseInt(id));
        await carregarDados();
        alert('Equipamento excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        alert(error.message);
    }
}

async function excluirInventario(id) {
    if (!confirm('Tem certeza que deseja excluir este item do inventário?')) return;
    try {
        await db.deleteInventarioItem(parseInt(id));
        await carregarDados();
        alert('Item do inventário excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir item do inventário:', error);
        alert('Erro ao excluir item do inventário. Verifique o console para mais detalhes.');
    }
}

function realizarPesquisa(e) {
    e.preventDefault();
    const termo = document.getElementById('pesquisa-termo').value.toLowerCase();
    const campo = document.getElementById('pesquisa-campo').value;
    const unidadeId = document.getElementById('pesquisa-unidade').value;

    let resultados = state.inventario;

    if (unidadeId) {
        resultados = resultados.filter(item => item.UnidadeID === parseInt(unidadeId));
    }
    
    if (termo) {
        resultados = resultados.filter(item => {
            const equipamento = state.equipamentos.find(e => e.ID === item.EquipamentoID) || { Descricao: '' };
            const unidade = state.unidades.find(u => u.ID === item.UnidadeID) || { Nome: '' };
            
            if (campo === 'tudo') {
                return (
                    (item.Serial?.toLowerCase().includes(termo)) ||
                    (item.Patrimonio?.toLowerCase().includes(termo)) ||
                    (item.IP?.toLowerCase().includes(termo)) ||
                    (item.Hostname?.toLowerCase().includes(termo)) ||
                    (equipamento.Descricao?.toLowerCase().includes(termo)) ||
                    (unidade.Nome?.toLowerCase().includes(termo)) ||
                    (item.LocalInstalado?.toLowerCase().includes(termo))
                );
            }
            return item[campo]?.toLowerCase().includes(termo);
        });
    }

    const tbody = document.getElementById('resultados-pesquisa');
    tbody.innerHTML = resultados.length === 0 ? 
        '<tr><td colspan="8" class="text-center">Nenhum resultado encontrado.</td></tr>' : 
        resultados.map(item => {
            const equipamento = state.equipamentos.find(e => e.ID === item.EquipamentoID) || { Descricao: 'Desconhecido' };
            const unidade = state.unidades.find(u => u.ID === item.UnidadeID) || { Nome: 'Desconhecida' };
            return `
                <tr>
                    <td>${item.ID}</td>
                    <td>${formatarData(item.DataCadastro)}</td>
                    <td>${equipamento.Descricao}</td>
                    <td>${item.Serial || '-'}</td>
                    <td>${item.Patrimonio || '-'}</td>
                    <td>${item.IP || '-'}</td>
                    <td>${item.Hostname || '-'}</td>
                    <td>${unidade.Nome}${item.LocalInstalado ? ` (${item.LocalInstalado})` : ''}</td>
                </tr>
            `;
        }).join('');
}

async function fazerBackup() {
    try {
        const backupData = await db.backup();
        //const dataStr = JSON.stringify(backupData);
        const dataStr = JSON.stringify(backupData, null, 2);
        const filename = `backup-inventario-${new Date().toISOString().split('T')[0]}.json`;
        downloadCSV(dataStr, filename);
        alert('Backup realizado com sucesso!');
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        alert('Erro ao fazer backup. Verifique o console para mais detalhes.');
    }
}

async function restaurarBackup() {
    const fileInput = document.getElementById('arquivo-backup');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecione um arquivo de backup.');
        return;
    }
    
    if (!confirm('ATENÇÃO: Esta operação irá substituir todos os dados atuais. Deseja continuar?')) {
        return;
    }
    
    try {
        const fileText = await readFileAsText(file);
        const backupData = JSON.parse(fileText);
        
        if (!backupData.unidades || !backupData.equipamentos || !backupData.inventario) {
            throw new Error('Arquivo de backup inválido.');
        }
        
        await db.restore(backupData);
        await carregarDados();
        alert('Dados restaurados com sucesso!');
        fileInput.value = '';
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        alert(error.message);
    }
}

function gerarRelatorioGeral() {
    const tbody = document.getElementById('relatorio-geral-body');
    if (!tbody) return;
    
    tbody.innerHTML = state.unidades.map(unidade => {
        const count = state.inventario.filter(item => item.UnidadeID === unidade.ID).length;
        return `
            <tr>
                <td>${unidade.Nome}</td>
                <td>${count}</td>
                <td>
                    <button class="btn btn-sm btn-info detalhes-unidade-geral" data-unidade="${unidade.ID}">
                        Ver Detalhes
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.detalhes-unidade-geral').forEach(btn => {
        btn.addEventListener('click', () => mostrarDetalhesUnidade(parseInt(btn.dataset.unidade)));
    });
}

function mostrarDetalhesUnidade(unidadeId) {
    const unidade = state.unidades.find(u => u.ID === unidadeId);
    if (!unidade) return;
    
    const itensUnidade = state.inventario.filter(item => item.UnidadeID === unidadeId);
    const equipamentosCount = {};
    itensUnidade.forEach(item => {
        const equipamentoId = item.EquipamentoID;
        if (!equipamentosCount[equipamentoId]) {
            equipamentosCount[equipamentoId] = 0;
        }
        equipamentosCount[equipamentoId]++;
    });
    
    let detalhes = `Relatório da Unidade: ${unidade.Nome}\n\n`;
    for (const equipamentoId in equipamentosCount) {
        const equipamento = state.equipamentos.find(e => e.ID === parseInt(equipamentoId)) || { Descricao: 'Desconhecido' };
        detalhes += `${equipamento.Descricao}: ${equipamentosCount[equipamentoId]} itens\n`;
    }
    
    alert(detalhes);
}

function gerarRelatorioUnidade() {
    const unidadeId = document.getElementById('select-unidade-relatorio').value;
    const btnExportar = document.getElementById('btn-exportar-unidade');
    const tbody = document.getElementById('relatorio-unidade-body');
    
    if (!unidadeId) {
        tbody.innerHTML = '';
        btnExportar.disabled = true;
        return;
    }
    
    btnExportar.disabled = false;
    const itensUnidade = state.inventario.filter(item => item.UnidadeID === parseInt(unidadeId));
    const equipamentosCount = {};
    itensUnidade.forEach(item => {
        const equipamentoId = item.EquipamentoID;
        equipamentosCount[equipamentoId] = (equipamentosCount[equipamentoId] || 0) + 1;
    });

    tbody.innerHTML = Object.keys(equipamentosCount).map(equipamentoId => {
        const equipamento = state.equipamentos.find(e => e.ID === parseInt(equipamentoId)) || { Descricao: 'Desconhecido' };
        const count = equipamentosCount[equipamentoId];
        return `
            <tr>
                <td>${equipamento.Descricao}</td>
                <td>${count}</td>
                <td>
                    <button class="btn btn-sm btn-info detalhes-equipamento" data-equipamento="${equipamentoId}" data-unidade="${unidadeId}">
                        Ver Detalhes
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function exportarRelatorioGeral() {
    let csv = 'Unidade,Total de Equipamentos\n';
    state.unidades.forEach(unidade => {
        const count = state.inventario.filter(item => item.UnidadeID === unidade.ID).length;
        csv += `"${unidade.Nome}",${count}\n`;
    });
    downloadCSV(csv, 'relatorio-geral.csv');
}

function exportarRelatorioUnidade() {
    const unidadeId = document.getElementById('select-unidade-relatorio').value;
    if (!unidadeId) return;
    
    const unidade = state.unidades.find(u => u.ID === parseInt(unidadeId));
    const itensUnidade = state.inventario.filter(item => item.UnidadeID === parseInt(unidadeId));
    const equipamentosCount = {};
    itensUnidade.forEach(item => {
        const equipamentoId = item.EquipamentoID;
        equipamentosCount[equipamentoId] = (equipamentosCount[equipamentoId] || 0) + 1;
    });
    
    let csv = `Relatório da Unidade: ${unidade.Nome}\n\n`;
    csv += 'Equipamento,Quantidade\n';
    
    for (const equipamentoId in equipamentosCount) {
        const equipamento = state.equipamentos.find(e => e.ID === parseInt(equipamentoId)) || { Descricao: 'Desconhecido' };
        csv += `"${equipamento.Descricao}",${equipamentosCount[equipamentoId]}\n`;
    }
    
    downloadCSV(csv, `relatorio-${unidade.Nome.replace(/\s+/g, '-')}.csv`);
}

function mostrarDetalhesEquipamento(equipamentoId, unidadeId) {
    const itens = state.inventario.filter(item => 
        item.EquipamentoID === equipamentoId && item.UnidadeID === unidadeId
    );
    
    const equipamento = state.equipamentos.find(e => e.ID === equipamentoId) || { Descricao: 'Desconhecido' };
    const unidade = state.unidades.find(u => u.ID === unidadeId) || { Nome: 'Desconhecida' };
    
    let detalhes = `Detalhes do equipamento: ${equipamento.Descricao}\n`;
    detalhes += `Unidade: ${unidade.Nome}\n\n`;
    detalhes += `Total de itens: ${itens.length}\n\n`;
    
    itens.forEach((item, index) => {
        detalhes += `Item ${index + 1}:\n`;
        detalhes += `  Serial: ${item.Serial || 'N/A'}\n`;
        detalhes += `  Patrimônio: ${item.Patrimonio || 'N/A'}\n`;
        detalhes += `  IP: ${item.IP || 'N/A'}\n`;
        detalhes += `  Hostname: ${item.Hostname || 'N/A'}\n`;
        detalhes += `  Local: ${item.LocalInstalado || 'N/A'}\n`;
        detalhes += `  Data de Cadastro: ${formatarData(item.DataCadastro)}\n\n`;
    });
    
    alert(detalhes);
}