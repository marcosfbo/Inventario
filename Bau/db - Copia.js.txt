// db.js
export class InventoryDB extends Dexie {
    constructor() {
        super('SistemaInventario');
        this.version(1).stores({
            tbUnidades: '++ID,SAP,Nome,Endereco',
            tbEquipamentos: '++ID,Descricao',
            tbInventario: '++ID,DataCadastro,EquipamentoID,Serial,Patrimonio,IP,Hostname,LocalInstalado,UnidadeID'
        });

        // Nova versão para adicionar os campos
        this.version(2).stores({
            tbUnidades: '++ID,SAP,Nome,Endereco',
            tbEquipamentos: '++ID,Descricao',
            tbInventario: '++ID,DataCadastro,EquipamentoID,Serial,Patrimonio,IP,Hostname,LocalInstalado,UnidadeID,Processador,MemoriaRAM,TecnologiaRAM,Storage'
        }).upgrade(tx => {
            // Lógica de upgrade para migrar dados, se necessário.
            // Neste caso, não é preciso, pois os novos campos aceitam 'null'.
        });
    }

    async getUnidades() {
        return await this.tbUnidades.toArray();
    }

    async getEquipamentos() {
        return await this.tbEquipamentos.toArray();
    }

    async getInventario() {
        return await this.tbInventario.toArray();
    }

    async addUnidade(unidade) {
        return await this.tbUnidades.add(unidade);
    }

    async updateUnidade(id, data) {
        return await this.tbUnidades.update(id, data);
    }

    async deleteUnidade(id) {
        const hasItems = await this.tbInventario.where('UnidadeID').equals(id).count() > 0;
        if (hasItems) {
            throw new Error('Não é possível excluir esta unidade, pois existem itens no inventário associados a ela.');
        }
        await this.tbUnidades.delete(id);
    }

    async addEquipamento(equipamento) {
        return await this.tbEquipamentos.add(equipamento);
    }

    async updateEquipamento(id, data) {
        return await this.tbEquipamentos.update(id, data);
    }

    async deleteEquipamento(id) {
        const hasItems = await this.tbInventario.where('EquipamentoID').equals(id).count() > 0;
        if (hasItems) {
            throw new Error('Não é possível excluir este equipamento, pois existem itens no inventário associados a ele.');
        }
        await this.tbEquipamentos.delete(id);
    }

    async addInventarioItem(item) {
        return await this.tbInventario.add(item);
    }

    async updateInventarioItem(id, data) {
        return await this.tbInventario.update(id, data);
    }

    async deleteInventarioItem(id) {
        await this.tbInventario.delete(id);
    }

    async backup() {
        return {
            unidades: await this.tbUnidades.toArray(),
            equipamentos: await this.tbEquipamentos.toArray(),
            inventario: await this.tbInventario.toArray(),
            dataBackup: new Date()
        };
    }

    async restore(data) {
        await this.tbUnidades.clear();
        await this.tbEquipamentos.clear();
        await this.tbInventario.clear();
        await this.tbUnidades.bulkAdd(data.unidades);
        await this.tbEquipamentos.bulkAdd(data.equipamentos);
        await this.tbInventario.bulkAdd(data.inventario);
    }
}