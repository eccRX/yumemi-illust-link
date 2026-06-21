import { ref } from 'vue'

// サイト全体で共有する単一のライトボックス状態
const open = ref(false)
const src = ref('')
const alt = ref('')

export function useLightbox() {
  function show(imageSrc: string, imageAlt = '') {
    src.value = imageSrc
    alt.value = imageAlt
    open.value = true
  }
  function close() {
    open.value = false
  }
  return { open, src, alt, show, close }
}
