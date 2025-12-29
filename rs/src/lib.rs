use std::{
  collections::HashMap,
  sync::{LazyLock, RwLock},
};

const MAX_MEMORY_MB: usize = 128;

// todo reconsider static size string to simplify and remove `MEM_USAGE`?

// Note: doesn't include hashmap pointers, mem_usage integer, etc. Only hash content size
static mut MEM_USAGE: usize = 0;
static CACHE_INT: LazyLock<RwLock<HashMap<String, i32>>> = LazyLock::new(|| RwLock::new(HashMap::new()));

fn est_entry_size_int<T>(key: &String) -> usize {
  size_of::<T>()
  + size_of::<String>()
  + key.capacity()
}

#[unsafe(no_mangle)]
pub fn has(key: String) -> bool {
  CACHE_INT.read().unwrap().contains_key(&key)
}

#[unsafe(no_mangle)]
pub fn set_int(key: String, value: i32) {
  let next_size = unsafe { MEM_USAGE + est_entry_size_int::<i32>(&key) };
  if next_size > MAX_MEMORY_MB { panic!("e_max_mem_reached"); }

  CACHE_INT.write().unwrap()
    .insert(key, value);

  unsafe { MEM_USAGE = next_size; }
}

#[unsafe(no_mangle)]
pub fn get_int(key: String) -> i32 {
  CACHE_INT.read().unwrap()
    .get(&key)
    .copied().unwrap()
}

#[unsafe(no_mangle)]
pub fn del_int(key: String) {
  CACHE_INT.write().unwrap().remove(&key);
  unsafe { MEM_USAGE -= est_entry_size_int::<i32>(&key) };
}

#[unsafe(no_mangle)]
pub fn clear() {
  CACHE_INT.write().unwrap().clear();
  unsafe { MEM_USAGE = 0; }
}

#[unsafe(no_mangle)]
pub fn get_size() -> usize {
  CACHE_INT.read().unwrap().len()
}

#[unsafe(no_mangle)]
pub fn get_mem() -> usize {
  unsafe { return MEM_USAGE };
}
