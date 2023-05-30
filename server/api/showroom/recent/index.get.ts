import Fuse from 'fuse.js'
import { getMembers } from '../members.get'
import ShowroomLog from '~~/library/database/schema/showroom/ShowroomLog'
import config from '~~/app.config'

export default defineEventHandler(async (event): Promise<IApiRecents> => await getRecents(getQuery(event)))
// const group = ['jkt48', 'hinatazaka46'].includes(config.group ?? 'all') ? config.group : 'all'

export async function getRecents(qq: any = null): Promise<IApiRecents> {
  let page = 1
  const maxPerpage = 30
  const perpage = Math.min(qq.perpage || 10, maxPerpage)
  const query: RecentsQuery = qq ?? {}
  if (query.page) page = Number(query.page) ?? 1
  if (page < 1) page = 1
  const sort: sortType = config.isSort(query.sort) ? query.sort : 'date'
  const order = parseInt((query.order ?? '-1') as string) || -1
  // ORDER : if -1 is descending. if 1 is ascending

  function getSort(sort: sortType): string {
    return `${order < 0 ? '-' : ''}${(() => {
      switch (sort) {
        case 'date':
          return 'live_info.end_date'
        case 'gift':
          return 'total_point'
        case 'views':
          return 'live_info.penonton.peak'
        case 'duration':
          return 'live_info.duration'
        default:
          return 'live_info.end_date'
      }
    })()}`
  }

  let members = await getMembers()
  let logs = [] as any[]
  let total = 0

  const search = query.search ? String(query.search) ?? '' : ''
  if (search !== '') {
    const fuse = new Fuse(members, {
      threshold: 0.2,
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'member_data.name', weight: 0.4 },
        { name: 'description', weight: 0.2 },
      ],
    })
    members = fuse.search(search).map(i => i.item)
  }

  const q = query.filter
  if (q === 'graduated' || q === 'active') {
    members = members.filter((i) => {
      return i.is_graduate === (q === 'graduated')
    })
  }

  interface Options {
    room_id?: number[]
    is_dev?: boolean
  }

  const options: Options = {}
  if (process.env.NODE_ENV !== 'development') options.is_dev = false
  if (members.length) {
    options.room_id = members.map(i => i.room_id)
    logs = await ShowroomLog.find(options)
      .select({
        live_info: {
          duration: 1,
          penonton: {
            peak: 1,
          },
          start_date: 1,
          end_date: 1,
        },
        data_id: 1,
        total_point: 1,
        created_at: 1,
        room_id: 1,
        room_info: 1,
      })
      .sort(getSort(sort))
      .skip((page - 1) * perpage)
      .limit(perpage)
      .populate({
        path: 'room_info',
        select: '-_id name img url -room_id member_data',
        populate: {
          path: 'member_data',
          select: '-_id isGraduate img',
        },
      })
      .lean()
  }

  total = await ShowroomLog.count(options)
  return {
    recents: logs.map<IRecent>(i => ({
      _id: i._id,
      data_id: i.data_id,
      member: {
        name: i.room_info?.name ?? 'Member not Found!',
        img_alt: i.room_info?.member_data?.img ?? i.room_info?.img ?? config.errorPicture,
        img: i.room_info?.img ?? config.errorPicture,
        url: i.room_info?.url ?? '',
        is_graduate: i.room_info?.member_data?.isGraduate ?? i.room_id === 332503,
      },
      created_at: i.created_at.toISOString(),
      live_info: {
        comments: i.live_info?.comments ?? undefined,
        duration: i.live_info?.duration ?? 0,
        viewers: i.live_info?.penonton?.peak ?? undefined,
        date: {
          start: i.live_info.start_date.toISOString(),
          end: i.live_info.end_date.toISOString(),
        },
      },
      room_id: i.room_id,
      points: i.total_point,
    })),
    page,
    perpage,
    total_count: total,
  }
}
