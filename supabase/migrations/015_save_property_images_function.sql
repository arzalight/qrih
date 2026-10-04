-- Inserta o reemplaza una galería solo cuando pertenece al usuario autenticado.
-- SECURITY DEFINER evita que las políticas de property_images bloqueen la
-- operación después de que la propiedad ya fue creada.
create or replace function public.replace_property_images(
  p_property_id uuid,
  p_images jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_image jsonb;
  v_position integer := 0;
  v_path text;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión.';
  end if;

  if jsonb_typeof(p_images) <> 'array'
    or jsonb_array_length(p_images) < 1
    or jsonb_array_length(p_images) > 7 then
    raise exception 'Debes registrar entre 1 y 7 fotografías.';
  end if;

  if not exists (
    select 1 from public.properties
    where id = p_property_id and owner_id = auth.uid()
  ) then
    raise exception 'No tienes permiso para actualizar estas fotografías.';
  end if;

  delete from public.property_images where property_id = p_property_id;

  for v_image in select value from jsonb_array_elements(p_images)
  loop
    v_path := v_image->>'storage_path';

    if v_path is null
      or v_path !~ ('^' || auth.uid()::text || '/.+\\.webp$') then
      raise exception 'La ruta de la fotografía no es válida.';
    end if;

    insert into public.property_images (
      property_id,
      storage_path,
      category,
      position
    ) values (
      p_property_id,
      v_path,
      case when v_position = 0 then 'main' else 'gallery' end,
      v_position
    );

    v_position := v_position + 1;
  end loop;
end;
$$;

revoke all on function public.replace_property_images(uuid, jsonb) from public;
grant execute on function public.replace_property_images(uuid, jsonb) to authenticated;
