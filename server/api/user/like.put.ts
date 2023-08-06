import { getToken } from '#auth'
import Liked from '~~/library/database/schema/user/Liked'

export default defineEventHandler(async (event): Promise<any> => {
  const token = await getToken({ event })
  if (!token?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthenticated!' })
  const query = await readBody(event)
  if (!query.user_id || !query.liked_id || !query.type) throw createError({ statusCode: 400, statusMessage: 'Bad request!' })
  await Liked.updateOne(
    {
      user_id: query.user_id,
      liked_id: query.liked_id,
      type: query.type,
    },
    {
      $set: {
        user_id: query.user_id,
        liked_id: query.liked_id,
        type: query.type,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  )
  return {
    status: 200,
    message: 'Success!',
  }
},
)