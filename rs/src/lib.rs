use std::{
  collections::HashMap,
  sync::{LazyLock, RwLock},
};
use wasm_bindgen::prelude::*;

const MAX_MEMORY_MB: usize = 128;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = performance)]
  fn now() -> f64;
}

// todo reconsider static size string to simplify and remove `MEM_USAGE`?

struct CacheEntry<V: CacheValue> {
  value: V,
  t_exp: f64,
}

trait CacheValue {} // todo hm, or just store memory buffer directly??
impl CacheValue for bool {}
impl CacheValue for f64 {}
impl CacheValue for String {}

static mut MEM_USAGE: usize = 0;
static CACHE_INT: LazyLock<RwLock<HashMap<String, CacheEntry<f64>>>> = LazyLock::new(|| RwLock::new(HashMap::new()));

fn est_entry_size_int<T: CacheValue>(key: &String) -> usize {
  size_of::<CacheEntry<T>>()
  + key.capacity()
}

#[wasm_bindgen]
pub fn has(key: String) -> bool {
  CACHE_INT.read().unwrap().contains_key(&key)
}

#[wasm_bindgen]
pub fn set_float(key: String, value: f64, ttl: i64) {
  let next_size = unsafe { MEM_USAGE + est_entry_size_int::<f64>(&key) };
  if next_size > MAX_MEMORY_MB { panic!("e_max_mem_reached"); }

  let new_struct = CacheEntry {
    value,
    t_exp: now() + ttl as f64
  };
  CACHE_INT.write().unwrap()
    .insert(key, new_struct);

  unsafe { MEM_USAGE = next_size; }
}

#[wasm_bindgen]
pub fn get_float(key: String) -> Option<f64> {
  let map = CACHE_INT.read().unwrap();

  if !map.contains_key(&key) {
    return None
  }

  let entry = map.get(&key).unwrap();

  if entry.t_exp < now() {
    // del_int(key);  // causes deadlock
    return None
  }

  return Some(entry.value)
}

#[wasm_bindgen]
pub fn del_float(key: String) {
  if !has(key.clone()) {
    return;
  }

  CACHE_INT.write().unwrap().remove(&key);
  unsafe { MEM_USAGE -= est_entry_size_int::<f64>(&key) };
}

#[wasm_bindgen]
pub fn clear() {
  CACHE_INT.write().unwrap().clear();
  unsafe { MEM_USAGE = 0; }
}

#[wasm_bindgen]
pub fn get_size_raw() -> usize {
  CACHE_INT.read().unwrap().len()
}

#[wasm_bindgen]
pub fn get_mem_raw() -> usize {
  unsafe { return MEM_USAGE };
}

// todo interval-cleanup

// temp
// enum CacheValueDyn {
//   Bool(bool),
//   I32(i32),
//   F64(f64),
//   Str(String),
// }
// #[wasm_bindgen]
// pub fn get_dyn() -> CacheValueDyn {
//   unsafe { return MEM_USAGE };
// }
