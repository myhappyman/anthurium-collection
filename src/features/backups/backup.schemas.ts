import { z } from "zod";

const jsonRecordSchema = z.record(z.string(), z.json());

export const collectionBackupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  profile: jsonRecordSchema.nullable(),
  genotypes: z.array(jsonRecordSchema),
  specimens: z.array(jsonRecordSchema),
  crosses: z.array(jsonRecordSchema),
  propagationEvents: z.array(jsonRecordSchema),
  observations: z.array(jsonRecordSchema),
  activityEvents: z.array(jsonRecordSchema),
  media: z.array(jsonRecordSchema),
  transactions: z.array(jsonRecordSchema),
});
