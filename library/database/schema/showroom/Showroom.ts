import { Schema, model } from 'mongoose'
import type { Model } from 'mongoose'
import Member from '../48group/Member'
import { dbConnect } from '../..'

interface IShowroomModel extends Model<Database.IShowroomMember> {
  getProfile(key: string): Promise<Database.IMemberProfile>
}

const ShowroomSchema = new Schema<Database.IShowroomMember, IShowroomModel>({
  name: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  img_square: {
    type: String,
  },
  description: {
    type: String,
  },
  group: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
  room_id: {
    type: Number,
    required: true,
    unique: true,
  },
  room_exists: {
    type: Boolean,
    default: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  generation: {
    type: String,
  },
  is_group: {
    type: Boolean,
    default: false,
  },
  member_data: {
    type: Schema.Types.ObjectId,
    ref: Member,
  },
})

ShowroomSchema.statics.getProfile = async function (key: string): Promise<Database.IMemberProfile | null> {
  await dbConnect()
  const doc = await this.findOne({ url: key })
    .populate({
      path: 'member_data',
      select: 'img isGraduate banner jikosokai socials birthdate name nicknames height bloodType',
    })
    .lean()

  if (!doc) return null

  return {
    name: doc.name,
    nickname: doc.member_data?.nicknames?.length ? doc.member_data.nicknames[0] : undefined,
    fullname: doc.member_data?.name ?? doc.name ?? 'No name!',
    img: doc.img,
    img_alt: doc.member_data?.img ?? doc.img_square ?? doc.img,
    banner: doc.member_data?.banner ?? '',
    description: doc.description ?? '',
    group: doc.group ?? '',
    jikosokai: doc.member_data?.jikosokai ?? '',
    generation: doc.generation,
    room_id: doc.room_id,
    socials: doc.member_data?.socials ?? [],
    is_graduate: doc.member_data?.isGraduate ?? false,
    bloodType: doc.member_data?.bloodType,
    height: doc.member_data?.height,
    is_group: doc.is_group ?? false,
    url: doc.url ?? key,
    birthdate: doc.member_data?.birthdate,
  }
}

export default model<Database.IShowroomMember, IShowroomModel>('Showroom', ShowroomSchema)
