import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: "jess-will-wedding",
      Key: file.name, // You can use your uniqueKey logic here too
      Body: buffer,
      ContentType: file.type,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}