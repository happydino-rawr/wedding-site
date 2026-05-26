import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function GET() {
  try {
    const list = await r2.send(new ListObjectsV2Command({
      Bucket: "jess-will-wedding",
    }));
    
    // Returns only the keys (filenames)
    const images = list.Contents?.map(item => item.Key) || [];
    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}