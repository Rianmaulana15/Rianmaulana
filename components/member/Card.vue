<script lang="ts" setup>
defineProps<{
  member: IMember
  isLive: boolean
}>()
const config = useAppConfig()
const openMenu = ref(false)
const listener = ref<any>(undefined)
const container = ref(null)
watch(openMenu, (isOpen) => {
  if (isOpen) {
    listener.value = onClickOutside(container, () => (openMenu.value = false))
  }
  else {
    listener?.value()
  }
})
</script>

<template>
  <div
    ref="container"
    class="bg-container flex flex-col items-stretch gap-3 overflow-hidden rounded-2xl p-8"
  >
    <div class="h-24 w-24 self-center overflow-hidden rounded-full">
      <NuxtLink :to="`/member/${member.url}`">
        <NuxtImg
          class="h-full w-full"
          :src="member.img_alt ?? member.img ?? config.errorPicture"
          :alt="`${member.name} Profile Picture`"
          fit="fill"
          :modifiers="{
            aspectRatio: 1,
            gravity: 'faceCenter',
          }"
          width="96px"
          :placeholder="[10, 10, 75, 5]"
          format="webp"
        />
      </NuxtLink>
    </div>
    <div class="text-center">
      <NuxtLink :to="`/member/${member.url}`" class="truncate text-xl font-bold">
        {{ member.nicknames[0] || member.name }}
      </NuxtLink>
      <div class="text-base" :class="member.is_group ? 'text-blue-500' : (member.is_graduate ? 'text-red-500' : 'text-green-500')">
        {{ member.is_group ? "Official" : (member.is_graduate ? "Graduated" : "Active") }}
      </div>
    </div>
    <div class="line-clamp-3 text-center text-sm">
      {{ member.description || $t('nodescription') }}
    </div>
    <div class="flex flex-1 items-end">
      <NuxtLink :to="`/member/${member.url.replace('/', '')}`" class="w-full rounded-full bg-blue-500 p-3 text-center text-white">
        {{ $t('viewprofile') }}
      </NuxtLink>
    </div>
  </div>
</template>
