import { ID, storage } from "@/appwrite"

const uploadImage = async (file: File) => {
  if (!file) return

  const fileUpload = await storage.createFile(
    process.env.NEXT_PUBLIC_BUCKET_ID!,
    ID.unique(),
    file
  )

  return fileUpload
}

export default uploadImage
