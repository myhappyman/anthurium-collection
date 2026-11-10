import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { catalogDataSchema } from "../src/features/catalog/catalog.types.ts";
import type { Database } from "../src/types/database.types.ts";

const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

async function main() {
  const environment = environmentSchema.parse(process.env);
  const catalogPath = path.resolve(process.cwd(), "data/taxa.json");
  const rawCatalog = await readFile(catalogPath, "utf8");
  const catalog = catalogDataSchema.parse(JSON.parse(rawCatalog));
  const supabase = createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const nodeRows: Database["public"]["Tables"]["catalog_nodes"]["Insert"][] =
    catalog.taxa.map((node) => ({
      legacy_slug: node.id,
      display_name: node.displayName,
      scientific_name: node.scientificName,
      kind: node.type,
      abbreviations: node.abbreviations,
      aliases: node.aka,
      description_ko: node.descriptionKo ?? null,
      traits: node.traits ?? {},
      tags: node.tags,
      source_urls: node.sources,
      is_verified: node.verified,
      visibility: "public",
      published_at: new Date().toISOString(),
    }));
  const { data: importedNodes, error: nodeError } = await supabase
    .from("catalog_nodes")
    .upsert(nodeRows, { onConflict: "legacy_slug" })
    .select("id, legacy_slug");

  if (nodeError) {
    throw new Error(nodeError.message);
  }

  const idByLegacySlug = new Map(
    importedNodes.map((node) => [node.legacy_slug, node.id] as const),
  );
  const edgeRows: Database["public"]["Tables"]["catalog_edges"]["Insert"][] =
    [];

  for (const node of catalog.taxa) {
    const childNodeId = idByLegacySlug.get(node.id);

    if (!childNodeId) {
      continue;
    }

    node.parents.forEach((parentSlug, index) => {
      const parentNodeId = idByLegacySlug.get(parentSlug);

      if (parentNodeId) {
        edgeRows.push({
          parent_node_id: parentNodeId,
          child_node_id: childNodeId,
          relation_kind: "cross",
          parent_role: index === 0 ? "seed" : "pollen",
        });
      }
    });

    if (node.selectionOf) {
      const parentNodeId = idByLegacySlug.get(node.selectionOf);

      if (parentNodeId) {
        edgeRows.push({
          parent_node_id: parentNodeId,
          child_node_id: childNodeId,
          relation_kind: "selection",
          parent_role: null,
        });
      }
    }
  }

  if (edgeRows.length > 0) {
    const { error: edgeError } = await supabase
      .from("catalog_edges")
      .upsert(edgeRows, {
        onConflict:
          "parent_node_id,child_node_id,relation_kind,parent_role",
      });

    if (edgeError) {
      throw new Error(edgeError.message);
    }
  }

  process.stdout.write(
    `도감 노드 ${importedNodes.length}개와 계보 간선 ${edgeRows.length}개를 가져왔습니다.\n`,
  );
}

await main();
