#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Bytes, BytesN, Env, String, Symbol,
};

fn make_hash(env: &Env, seed: u8) -> BytesN<32> {
    let mut buf = [0u8; 32];
    buf[0] = seed;
    BytesN::from_array(env, &buf)
}

fn make_user_id(env: &Env, n: u8) -> String {
    let s = soroban_sdk::String::from_str(env, match n {
        1 => "user-01", 2 => "user-02", 3 => "user-03",
        4 => "user-04", 5 => "user-05", 6 => "user-06",
        _ => "user-xx",
    });
    s
}

fn setup(env: &Env) -> (ChargeRegistryClient, Address) {
    let contract_id = env.register(ChargeRegistry, ());
    let client = ChargeRegistryClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_register_and_get() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-0001");
    let user_id = make_user_id(&env, 1);
    let payload_hash = make_hash(&env, 1);

    client.register(&charge_id, &user_id, &1, &25000, &payload_hash);

    let record = client.get(&charge_id).expect("charge not found");
    assert_eq!(record.user_id, user_id);
    assert_eq!(record.charge_number, 1);
    assert_eq!(record.amount_brl, 25000);
    assert_eq!(record.payload_hash, payload_hash);
    assert_eq!(record.status, Symbol::new(&env, "pending"));
}

#[test]
#[should_panic(expected = "charge already registered")]
fn test_duplicate_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-dup");
    let user_id = make_user_id(&env, 2);
    let hash = make_hash(&env, 2);

    client.register(&charge_id, &user_id, &1, &1000, &hash);
    client.register(&charge_id, &user_id, &2, &1000, &hash);
}

#[test]
fn test_get_nonexistent_returns_none() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"nao-existe");
    assert!(client.get(&charge_id).is_none());
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_init_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    client.init(&Address::generate(&env));
}

#[test]
fn test_admin_query() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, admin) = setup(&env);
    assert_eq!(client.admin(), Some(admin));
}

#[test]
fn test_register_requires_admin_auth() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-auth");
    let user_id = make_user_id(&env, 4);
    client.register(&charge_id, &user_id, &1, &5000, &make_hash(&env, 4));

    let auths = env.auths();
    let admin_auth = auths.iter().any(|(addr, _invocation)| *addr == admin);
    assert!(admin_auth, "register deve exigir auth do admin");
}

#[test]
fn test_update_status() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-status");
    let user_id = make_user_id(&env, 5);
    client.register(&charge_id, &user_id, &1, &10000, &make_hash(&env, 5));

    let record = client.get(&charge_id).expect("not found");
    assert_eq!(record.status, Symbol::new(&env, "pending"));

    client.update_status(&charge_id, &Symbol::new(&env, "paid"));

    let record = client.get(&charge_id).expect("not found");
    assert_eq!(record.status, Symbol::new(&env, "paid"));
}

#[test]
#[should_panic(expected = "charge not found")]
fn test_update_status_nonexistent_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"nao-existe-status");
    client.update_status(&charge_id, &Symbol::new(&env, "paid"));
}

#[test]
fn test_update_status_requires_admin_auth() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-status-auth");
    let user_id = make_user_id(&env, 6);
    client.register(&charge_id, &user_id, &1, &5000, &make_hash(&env, 6));
    client.update_status(&charge_id, &Symbol::new(&env, "paid"));

    let auths = env.auths();
    let admin_auth = auths.iter().any(|(addr, _)| *addr == admin);
    assert!(admin_auth, "update_status deve exigir auth do admin");
}

#[test]
fn test_extend_ttl_existing() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-ttl");
    let user_id = make_user_id(&env, 3);
    client.register(&charge_id, &user_id, &1, &5000, &make_hash(&env, 3));
    client.extend_charge_ttl(&charge_id);
}

#[test]
fn test_extend_ttl_nonexistent_is_noop() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let charge_id = Bytes::from_slice(&env, b"uuid-ghost");
    client.extend_charge_ttl(&charge_id);
}
