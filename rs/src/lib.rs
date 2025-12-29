#[unsafe(no_mangle)]
pub extern "C" fn mutate(ptr: *mut i32) {
  unsafe { *ptr += 1 };
}
