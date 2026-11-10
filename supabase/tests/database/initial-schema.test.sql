begin;

select plan(14);

select has_table('public', 'catalog_nodes', 'catalog_nodes table exists');
select has_table('public', 'genotypes', 'genotypes table exists');
select has_table('public', 'crosses', 'crosses table exists');
select has_table('public', 'specimens', 'specimens table exists');
select has_table('public', 'propagation_events', 'propagation_events table exists');
select has_table('public', 'observations', 'observations table exists');
select has_table('public', 'activity_events', 'activity_events table exists');
select has_table('public', 'media', 'media table exists');
select has_table('public', 'transactions', 'transactions table exists');

select is_enum(
  'public',
  'propagation_method',
  'propagation_method is an enum'
);
select enum_has_labels(
  'public',
  'propagation_method',
  array['seed', 'offset', 'division', 'stem_cut', 'tissue_culture'],
  'propagation methods are explicit'
);

select col_is_fk(
  'public',
  'specimens',
  'genotype_id',
  'specimen belongs to a genotype'
);
select col_is_fk(
  'public',
  'propagation_events',
  'source_specimen_id',
  'propagation references its source specimen'
);
select col_is_fk(
  'public',
  'propagation_events',
  'target_specimen_id',
  'propagation references its target specimen'
);

select * from finish();
rollback;
