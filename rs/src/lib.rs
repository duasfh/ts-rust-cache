use std::{
  collections::HashMap,
  sync::{LazyLock, RwLock},
};
use wasm_bindgen::prelude::*;

const MAX_MEMORY_MB: usize = 128;
const MAX_MEMORY_B: usize = MAX_MEMORY_MB * 1024 * 1024;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = performance)]
  fn now() -> f64;
  #[wasm_bindgen(js_namespace = console)]
  fn log(str: &str);
}

#[derive(Clone)]
enum ValueType { Bool, F64, Str, Obj = 16, Date = 17 }

struct CacheEntry {
  vt: ValueType,
  vbuf: Vec<u8>,
  t_exp: f64,
}

static mut MEM_USAGE: usize = 0;
static CACHE: LazyLock<RwLock<HashMap<String, CacheEntry>>> = LazyLock::new(|| RwLock::new(HashMap::new()));

fn convert_u8_to_vt (t: u8) -> ValueType {
  match t {
    0 => Ok(ValueType::Bool),
    1 => Ok(ValueType::F64),
    2 => Ok(ValueType::Str),
    16 => Ok(ValueType::Obj),
    17 => Ok(ValueType::Date),
    _ => Err(())
  }.unwrap()
}

fn convert_vt_to_u8 (vt: ValueType) -> u8 {
  vt as u8
}

fn pack_cache_dto (ce: &CacheEntry) -> Vec<u8> {
  let mut packed_vec = Vec::with_capacity(1 + ce.vbuf.len());

  packed_vec.push(convert_vt_to_u8(ce.vt.clone()));
  packed_vec.extend_from_slice(&ce.vbuf);

  packed_vec
}

fn est_entry_size_int(key: &String, buf: &Vec<u8>) -> usize {
  size_of::<CacheEntry>()
  + buf.capacity()
  + key.capacity()
}

#[wasm_bindgen]
pub fn has(key: String) -> bool {
  CACHE.read().unwrap().contains_key(&key)
}

#[wasm_bindgen]
pub fn set(key: String, value: Vec<u8>, t: u8, ttl: f64) {
  let vt = convert_u8_to_vt(t);

  let next_size = unsafe { MEM_USAGE + est_entry_size_int(&key, &value) };
  if next_size > MAX_MEMORY_B { panic!("e_max_mem_reached"); }

  let new_struct = CacheEntry {
    vt,
    vbuf: value,
    t_exp: now() + ttl,
  };
  CACHE.write().unwrap()
    .insert(key, new_struct);

  unsafe { MEM_USAGE = next_size; }
}

#[wasm_bindgen]
pub fn get(key: String) -> Option<Vec<u8>> {
  let map = CACHE.read().unwrap();

  if !map.contains_key(&key) {
    return None
  }

  let entry = map.get(&key).unwrap();

  if entry.t_exp < now() {
    return None
  }

  return Some(pack_cache_dto(entry));
}

#[wasm_bindgen]
pub fn del(key: String) {
  if !has(key.clone()) {
    return;
  }

  let size: usize;
  {
    let map = CACHE.read().unwrap();
    let entry = map.get(&key).unwrap();
    size = est_entry_size_int(&key, &entry.vbuf);
  }

  CACHE.write().unwrap().remove(&key);
  unsafe { MEM_USAGE -= size };
}

#[wasm_bindgen]
pub fn clear() {
  CACHE.write().unwrap().clear();
  unsafe { MEM_USAGE = 0; }
}

#[wasm_bindgen]
pub fn get_size_raw() -> usize {
  CACHE.read().unwrap().len()
}

#[wasm_bindgen]
pub fn get_mem_raw() -> usize {
  unsafe { return MEM_USAGE };
}

#[wasm_bindgen]
pub fn cleanup() {
  let now = now();
  CACHE.write().unwrap().retain(
    |_, e| e.t_exp > now
  );
}
