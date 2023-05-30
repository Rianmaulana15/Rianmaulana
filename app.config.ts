type GiftSize = 'small' | 'medium'

const defaultRecentQuery: RecentsQuery = {
  sort: 'date',
  page: 1,
  filter: 'all',
  order: -1,
}

function isSort(s: any): s is sortType {
  const sort: sortType[] = ['date', 'gift', 'views', 'duration']
  return sort.includes(s)
}

const urls = {
  giftUrl: (id: string | number, type: GiftSize = 'small') =>
    `https://static.showroom-live.com/image/gift/${id}_${type === 'small' ? 's' : 'm'}.png`,
  avatarURL: (id: number | string) => `https://static.showroom-live.com/image/avatar/${id}.png`,
  profileURL: (roomId: number | string) => `https://www.showroom-live.com/room/profile?room_id=${roomId}`,
  liveURL: (key: string) => `https://www.showroom-live.com/r${key?.startsWith('/') ? '' : '/'}${key}`,
  followURL: 'https://www.showroom-live.com/follow',
  tweetURL: (text: string) => `https://twitter.com/intent/tweet?text=${text}`,
  errorPicture: 'https://res.cloudinary.com/haymzm4wp/image/upload/v1674294578/assets/img/image-notfound_wsaxhy.jpg',
  fansProfileURL: (userId: string | number) => `https://www.showroom-live.com/user/profile?user_id=${userId}`,
  cloudinaryURL: 'https://res.cloudinary.com/haymzm4wp/image/upload/',
  screenshotURL: (folder: string, id: string, format: string) =>
    `https://res.cloudinary.com/haymzm4wp/image/upload/${folder?.startsWith('/') ? '' : '/'}${folder}/${id}.${format}`,
}

const SortList: SortData[] = [
  {
    title: {
      btn: 'sort.date',
      asc: 'sort.latest',
      desc: 'sort.oldest',
    },
    id: 'date',
  },
  {
    title: {
      btn: 'sort.gift',
      asc: 'sort.mostgift',
      desc: 'sort.leastgift',
    },
    id: 'gift',
  },
  {
    title: {
      btn: 'sort.views',
      asc: 'sort.mostviewers',
      desc: 'sort.leastviewers',
    },
    id: 'views',
  },
  {
    title: {
      btn: 'sort.duration',
      asc: 'sort.longestduration',
      desc: 'sort.shortestduration',
    },
    id: 'duration',
  },
]
export default {
  group: 'jkt48', // jkt48, hinatazaka or all
  ...urls,
  sortList: SortList,
  defaultRecentQuery,
  isSort,
  isAdmin(id: string) {
    const ids = (process.env.DISCORD_ADMINS ?? '').split(',').map(i => i.trim())
    return ids.includes(id)
  },
}
