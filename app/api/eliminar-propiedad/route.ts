import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assertSameOrigin, readJson, validUuid } from '@/lib/request-security';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase no está configurado correctamente.' },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'No autorizado.' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;

  try {
    assertSameOrigin(request);
    body = await readJson(request);
  } catch {
    return NextResponse.json(
      { error: 'Solicitud inválida.' },
      { status: 400 }
    );
  }

  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : '';

  if (!validUuid(propertyId)) {
    return NextResponse.json(
      { error: 'Falta el ID de la propiedad.' },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'No se pudo verificar la cuenta.' },
      { status: 403 }
    );
  }

  if (profile.account_status !== 'active') {
    return NextResponse.json(
      { error: 'Una cuenta suspendida no puede eliminar propiedades.' },
      { status: 403 }
    );
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, owner_id')
    .eq('id', propertyId)
    .eq('owner_id', user.id)
    .single();

  if (propertyError || !property) {
    return NextResponse.json(
      { error: 'Propiedad no encontrada o no tienes permiso para eliminarla.' },
      { status: 404 }
    );
  }

  let storagePaths: string[] | null = null;
  let deleteError: unknown;
  try {
    const result = await supabase.rpc(
      'qrih_delete_own_property', { p_property_id: property.id }
    );
    storagePaths = result.data;
    deleteError = result.error;
  } catch {
    return NextResponse.json({ error: 'No pudimos confirmar la eliminación. Recarga Mis propiedades antes de reintentar.' }, { status: 503 });
  }
  if (deleteError || !storagePaths) {
    return NextResponse.json({ error: 'No pudimos confirmar la eliminación. Recarga Mis propiedades antes de reintentar.' }, { status: 400 });
  }

  if (storagePaths.length > 0) {
    let storageError: unknown;
    try {
      const result = await supabase.storage
        .from('property-images')
        .remove(storagePaths);
      storageError = result.error;
    } catch {
      storageError = true;
    }

    if (storageError) {
      console.warn('QRIH_DELETE_STORAGE_CLEANUP_FAILED');

      return NextResponse.json({
        ok: true,
        warning:
          'La propiedad fue eliminada, pero algunas imágenes antiguas podrían permanecer temporalmente en Storage.',
      });
    }
  }

  return NextResponse.json({ ok: true });
}
