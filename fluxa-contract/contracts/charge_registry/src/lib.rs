#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, String, Symbol,
};

#[contracttype]
pub enum DataKey {
    Admin,
    Charge(Bytes),
}

#[contracttype]
#[derive(Clone)]
pub struct ChargeRecord {
    pub user_id: String,
    pub charge_number: u32,
    pub amount_brl: i128,
    pub payload_hash: BytesN<32>,
    pub timestamp: u64,
    pub status: Symbol,
}

#[contractevent]
pub struct ChargeCreated {
    pub charge_id: Bytes,
    pub user_id: String,
    pub charge_number: u32,
    pub amount_brl: i128,
}

#[contractevent]
pub struct ChargeStatusUpdated {
    pub charge_id: Bytes,
    pub status: Symbol,
}

const TTL_LEDGERS: u32 = 3_110_400;

#[contract]
pub struct ChargeRegistry;

#[contractimpl]
impl ChargeRegistry {

    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().extend_ttl(TTL_LEDGERS, TTL_LEDGERS);
    }

    pub fn register(
        env: Env,
        charge_id: Bytes,
        user_id: String,
        charge_number: u32,
        amount_brl: i128,
        payload_hash: BytesN<32>,
    ) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("contract not initialized");
        admin.require_auth();

        let key = DataKey::Charge(charge_id.clone());

        if env.storage().persistent().has(&key) {
            panic!("charge already registered");
        }

        let record = ChargeRecord {
            user_id: user_id.clone(),
            charge_number,
            amount_brl,
            payload_hash,
            timestamp: env.ledger().timestamp(),
            status: Symbol::new(&env, "pending"),
        };

        env.storage().persistent().set(&key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_LEDGERS, TTL_LEDGERS);

        env.events().publish_event(&ChargeCreated { charge_id, user_id, charge_number, amount_brl });
    }

    pub fn update_status(env: Env, charge_id: Bytes, status: Symbol) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("contract not initialized");
        admin.require_auth();

        let key = DataKey::Charge(charge_id.clone());

        let mut record: ChargeRecord = env
            .storage()
            .persistent()
            .get(&key)
            .expect("charge not found");

        record.status = status.clone();

        env.storage().persistent().set(&key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_LEDGERS, TTL_LEDGERS);

        env.events()
            .publish_event(&ChargeStatusUpdated { charge_id, status });
    }

    pub fn get(env: Env, charge_id: Bytes) -> Option<ChargeRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::Charge(charge_id))
    }

    pub fn extend_charge_ttl(env: Env, charge_id: Bytes) {
        let key = DataKey::Charge(charge_id);
        if env.storage().persistent().has(&key) {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_LEDGERS, TTL_LEDGERS);
        }
    }

    pub fn admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}

mod test;
