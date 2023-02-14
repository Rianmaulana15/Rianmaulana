/* eslint-disable camelcase */
import { getMembers } from './members.get'
import { getDateRange } from '~~/library/utils'
import ShowroomLog from '~~/library/database/schema/showroom/ShowroomLog'
import cache from '~~/library/utils/cache'
import calculationTime from '~~/library/utils/calculationTime'

function isIDateRangeType (value: string): value is IDateRangeType {
  return ['weekly', 'monthly', 'quarterly'].includes(value)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = isIDateRangeType(query.type as string) ? query.type : undefined
  return await getStats(type as IDateRangeType)
})

export { getStats, calculateFansPoints, getDateRange }

async function getStats (type : IDateRangeType = 'quarterly'): Promise<IShowroomStats> {
  const dateRange = getDateRange(type)
  const data = await cache.fetch<IShowroomStats>(type, () => fetchData(type), 2629800000)
  if (data?.date?.to === dateRange.to) { return data }
  return await fetchData(type)
}

async function fetchData (type : IDateRangeType): Promise<IShowroomStats> {
  const dateRange = {
    from: getDateRange('quarterly').from,
    to: getDateRange('weekly').to
  } // get all data and then convert it to monthly and weekly
  const members = await getMembers()
  if (!members) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch data!'
    })
  }

  const select = {
    room_info: 1,
    total_point: 1,
    created_at: 1,
    users: 1,
    live_info: {
      stage_list: 1,
      start_date: 1,
      end_date: 1,
      penonton: {
        peak: 1
      }
    },
    data_id: 1,
    room_id: 1
  }
  const option: StatsOptions = {
    room_id: members.map(i => i.room_id),
    'live_info.end_date': {
      $gte: dateRange.from,
      $lte: dateRange.to
    }
  }
  if (!process.env.IS_DEV) { option.is_dev = false }
  const logs = await calculationTime(async () => await ShowroomLog.find(option, select)
    .lean()
    .populate({
      path: 'room_info',
      select: '-_id name img url -room_id member_data',
      populate: {
        path: 'member_data',
        select: '-_id isGraduate img'
      }
    })) as unknown as IShowroomLog[]

  const weekly = generate(logs, 'weekly')
  const monthly = generate(logs, 'monthly')
  const quarterly = generate(logs, 'quarterly')

  cache.set(weekly.type, weekly)
  cache.set(monthly.type, monthly)
  cache.set(quarterly.type, quarterly)

  if (type === 'quarterly') {
    return quarterly
  } else if (type === 'monthly') {
    return monthly
  } else {
    return weekly
  }
}

function generate (logs :IShowroomLog[], type : IDateRangeType) {
  const dateRange = getDateRange(type)

  logs = logs.filter(i => new Date(i.live_info.start_date).getTime() >= new Date(dateRange.from).getTime() && new Date(i.live_info.start_date).getTime() <= new Date(dateRange.to).getTime())
  const all = calculateRanks(logs)
  const memberList = all.member.map((i) => {
    return {
      ...i,
      live_point: i.total_viewer / i.live_count + i.point / 100,
      avg_viewer: Math.floor(i.total_viewer / i.live_count)
    }
  })
  const statsLive: IStats[] = [
    {
      title: 'Live Count',
      key: 'livecount',
      value: all.member.reduce((a, b) => a + b?.live_count ?? 0, 0)
    }
  ]
  if (memberList.length) {
    const mostLive = memberList.sort((a, b) => b.live_count - a.live_count)[0]
    const topMember = memberList.sort((a, b) => b.live_point - a.live_point)[0]
    const mostViews = memberList.sort((a, b) => b.avg_viewer - a.avg_viewer)[0]
    statsLive.push(
      ...[
        {
          title: 'Most Live',
          key: 'mostlive',
          img: {
            title: mostLive.name,
            src: mostLive.img
          },
          value: `${mostLive.live_count} ${mostLive.live_count > 1 ? 'Lives' : 'Live'}`
        },
        {
          title: 'Top Member',
          key: 'topmember',
          img: {
            title: topMember.name,
            src: topMember.img
          },
          value: topMember.name
        },
        {
          title: 'Most Viewer',
          key: 'mostviewer',
          img: {
            title: mostViews.name,
            src: mostViews.img
          },
          value:
            mostViews.avg_viewer > 1000
              ? `${(mostViews.avg_viewer / 1000).toFixed(2)}K Viewers`
              : `${mostViews.avg_viewer} ${mostViews.avg_viewer > 1 ? 'Viewers' : 'Viewer'}`
        }
      ]
    )
  }
  return {
    type,
    ranks: all,
    stats: statsLive,
    date: {
      from: dateRange.from,
      to: dateRange.to
    }
  }
}

interface CalculatedRanks {
  member: IStatMember[];
  fans: IStatFans[];
}

function calculateRanks (logs: IShowroomLog[]): CalculatedRanks {
  const memberRanks: Map<string | number, IStatMember> = new Map()

  for (const log of logs) {
    if (memberRanks.has(log.room_id)) {
      const member = memberRanks.get(log.room_id)
      if (member) {
        member.live_count += 1
        member.total_viewer += log?.live_info?.penonton?.peak ?? 0
        member.point += log.total_point
      }
    } else {
      memberRanks.set(log.room_id, {
        room_id: log.room_id,
        name: log.room_info?.name ?? 'Member not Found!',
        img:
          log.room_info?.member_data?.img ||
          log.room_info?.img ||
          'https://image.showroom-cdn.com/showroom-prod/assets/img/v3/img-err-404.jpg?t=1602821561',
        url: log.room_info?.url ?? '',
        live_count: 1,
        total_viewer: log?.live_info?.penonton?.peak ?? 0,
        point: log.total_point
      })
    }
  }

  const users = logs.reduce<IFansCompact[]>((a, b) => {
    for (const user of b.users) {
      a.push({
        name: user.name,
        avatar_id: user.avatar_id,
        id: user.user_id
      })
    }
    return a
  }, [] as IFansCompact[])

  const stageList = logs.reduce<IStageList[]>((a, b) => {
    a.push(...(b.live_info?.stage_list ?? []))
    return a
  }, [] as IStageList[])

  return {
    member: Array.from(memberRanks.values()).sort((a, b) => b.point - a.point),
    fans: calculateFansPoints(users, stageList)
  }
}

function calculateFansPoints (usersData: IFansCompact[], stageList: IStageList[]) {
  const fansRanks: Map<string | number, number> = new Map()
  const users: Map<string | number, IFans> = new Map()
  for (const user of usersData) {
    users.set(user.id, {
      name: user.name,
      avatar_id: user.avatar_id,
      id: user.id
    })
  }

  for (const stage of stageList ?? []) {
    for (const [i, id] of stage.list.entries()) {
      const point = getRankPoints(i)
      if (fansRanks.has(id)) {
        fansRanks.set(id, (fansRanks.get(id) ?? 0) + point)
      } else {
        fansRanks.set(id, point)
      }
    }
  }

  return Array.from(fansRanks, ([user_id, fans_point]): IStatFans => {
    const user = users.get(user_id) ?? {
      name: 'User not found!',
      avatar_id: 1
    }
    return {
      id: Number(user_id),
      name: user.name,
      avatar_id: user.avatar_id,
      fans_point
    }
  })
    .sort((a, b) => b.fans_point - a.fans_point)
    .slice(0, 100)
}

function getRankPoints (rank: number) {
  if (rank < 4) {
    return 165 + (4 - rank) * 15
  } else if (rank < 14) {
    return 125 + (14 - rank) * 4
  } else if (rank < 51) {
    return 51 + (51 - rank) * 2
  } else {
    return 100 - rank + 1
  }
}