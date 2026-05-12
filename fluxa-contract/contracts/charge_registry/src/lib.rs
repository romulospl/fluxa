#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, Symbol,
};

// --- Chaves de Armazenamento (Storage Keys) ---
// Define como vamos identificar os dados salvos na memória da blockchain.
#[contracttype]
pub enum DataKey {
    Admin,           // Chave para salvar o endereço do administrador (dono)
    Charge(Bytes),   // Chave para salvar cada cobrança, usando o ID dela como identificador
}

// --- Estrutura de Dados da Cobrança ---
// Define quais informações serão gravadas para cada cobrança registrada.
#[contracttype]
#[derive(Clone)]
pub struct ChargeRecord {
    pub amount_brl: i128,         // Valor em centavos (ex: 1000 = R$ 10,00). Usamos i128 para evitar erros de arredondamento.
    pub payload_hash: BytesN<32>,   // Uma "digital" (SHA-256) dos detalhes da cobrança para auditoria.
    pub timestamp: u64,           // Momento exato em que o registro foi feito na blockchain.
    pub status: Symbol,           // Status atual: "pending", "paid", "cancelled", "overdue"
}

// --- Definição de Eventos ---
// Eventos são como "notificações" que o contrato envia para que sistemas externos saibam o que aconteceu.

#[contractevent]
pub struct ChargeCreated {
    pub charge_id: Bytes,
    pub amount_brl: i128,
}

#[contractevent]
pub struct ChargeStatusUpdated {
    pub charge_id: Bytes,
    pub status: Symbol,
}

// Configuração de tempo de vida dos dados: aproximadamente 5 anos (em número de blocos/ledgers).
const TTL_LEDGERS: u32 = 3_110_400;

// --- Implementação do Contrato ---
#[contract]
pub struct ChargeRegistry;

#[contractimpl]
impl ChargeRegistry {
    
    /// Função de Inicialização: Define quem será o administrador do contrato.
    /// Deve ser chamada apenas uma vez logo após o deploy.
    pub fn init(env: Env, admin: Address) {
        // Verifica se já existe um admin. Se sim, impede que outro seja definido.
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contrato ja inicializado!");
        }
        
        // Salva o endereço do admin na memória do contrato.
        env.storage().instance().set(&DataKey::Admin, &admin);
        
        // Define por quanto tempo essa configuração de admin ficará guardada.
        env.storage().instance().extend_ttl(TTL_LEDGERS, TTL_LEDGERS);
    }

    /// Registra uma nova cobrança na blockchain.
    /// Apenas o administrador definido no 'init' pode executar esta função.
    pub fn register(
        env: Env,
        charge_id: Bytes,
        amount_brl: i128,
        payload_hash: BytesN<32>,
    ) {
        // 1. Busca quem é o admin salvo.
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contrato nao inicializado!");

        // 2. A TRAVA: Verifica se quem está chamando é realmente o admin (exige assinatura).
        admin.require_auth();

        // 3. Cria a chave para esta cobrança específica.
        let key = DataKey::Charge(charge_id.clone());

        // 4. Verifica se esta cobrança já não foi registrada antes para evitar duplicidade.
        if env.storage().persistent().has(&key) {
            panic!("Esta cobranca ja foi registrada anteriormente!");
        }

        // 5. Monta a "ficha" (registro) da cobrança.
        let record = ChargeRecord {
            amount_brl,
            payload_hash,
            timestamp: env.ledger().timestamp(), // Pega o horário atual da blockchain.
            status: Symbol::new(&env, "pending"), // Toda cobrança começa como "pendente".
        };

        // 6. Salva a ficha na memória persistente da blockchain.
        env.storage().persistent().set(&key, &record);
        
        // 7. Define a validade desse registro (5 anos).
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_LEDGERS, TTL_LEDGERS);

        // 8. Emite um evento avisando que uma nova cobrança foi criada.
        env.events().publish_event(&ChargeCreated { charge_id, amount_brl });
    }

    /// Atualiza o status de uma cobrança existente (ex: de 'pending' para 'paid').
    /// Apenas o administrador pode alterar o status.
    pub fn update_status(env: Env, charge_id: Bytes, status: Symbol) {
        // Verifica autorização do admin.
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contrato nao inicializado!");
        admin.require_auth();

        let key = DataKey::Charge(charge_id.clone());

        // Busca o registro atual no armazenamento.
        let mut record: ChargeRecord = env
            .storage()
            .persistent()
            .get(&key)
            .expect("Cobranca nao encontrada!");

        // Atualiza apenas o campo status.
        record.status = status.clone();

        // Salva o registro atualizado de volta na blockchain.
        env.storage().persistent().set(&key, &record);
        
        // Renova a validade do registro por mais 5 anos.
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_LEDGERS, TTL_LEDGERS);

        // Emite evento de status atualizado.
        env.events()
            .publish_event(&ChargeStatusUpdated { charge_id, status });
    }

    /// Consulta os dados de uma cobrança registrada.
    /// Qualquer pessoa pode chamar esta função (leitura pública).
    pub fn get(env: Env, charge_id: Bytes) -> Option<ChargeRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::Charge(charge_id))
    }

    /// Função de utilidade para manter os dados vivos na rede por mais tempo.
    /// Pode ser chamada por qualquer um para garantir que o registro não expire.
    pub fn extend_charge_ttl(env: Env, charge_id: Bytes) {
        let key = DataKey::Charge(charge_id);
        if env.storage().persistent().has(&key) {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_LEDGERS, TTL_LEDGERS);
        }
    }

    /// Retorna qual endereço é o administrador atual do contrato.
    pub fn admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}

mod test;

