begin;

drop policy if exists "admins can insert audit logs" on public.audit_logs;
create policy "admins can insert audit logs"
  on public.audit_logs for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "admins can read audit logs" on public.audit_logs;
create policy "admins can read audit logs"
  on public.audit_logs for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "admins can read demand requests" on public.demand_requests;
create policy "admins can read demand requests"
  on public.demand_requests for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "users can read own demand requests" on public.demand_requests;
create policy "users can read own demand requests"
  on public.demand_requests for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users can create opportunity registrations" on public.opportunity_property_registrations;
create policy "users can create opportunity registrations"
  on public.opportunity_property_registrations for insert to authenticated
  with check (
    registered_by = auth.uid()
    and exists (
      select 1 from public.properties p
      where p.id = opportunity_property_registrations.property_id
        and p.owner_id = auth.uid()
        and p.status = 'published'
    )
  );

drop policy if exists "users can read own opportunity registrations" on public.opportunity_property_registrations;
create policy "users can read own opportunity registrations"
  on public.opportunity_property_registrations for select to authenticated
  using (
    registered_by = auth.uid()
    or exists (
      select 1 from public.properties p
      where p.id = opportunity_property_registrations.property_id
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.demand_requests d
      where d.id = opportunity_property_registrations.demand_request_id
        and d.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "admins can read all properties" on public.properties;
create policy "admins can read all properties"
  on public.properties for select to public
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "owners can resubmit rejected properties" on public.properties;
create policy "owners can resubmit rejected properties"
  on public.properties for update to authenticated
  using (auth.uid() = owner_id and status = 'rejected')
  with check (auth.uid() = owner_id and status = 'pending');

drop policy if exists "advisors can read own contact authorizations" on public.property_contact_authorizations;
create policy "advisors can read own contact authorizations"
  on public.property_contact_authorizations for select to authenticated
  using (advisor_id = auth.uid());

drop policy if exists "authenticated users can request contact" on public.property_contact_authorizations;
create policy "authenticated users can request contact"
  on public.property_contact_authorizations for insert to authenticated
  with check (
    advisor_id = auth.uid()
    and (
      status = 'pending'
      or (
        status = 'authorized'
        and exists (
          select 1 from public.properties
          where properties.id = property_contact_authorizations.property_id
            and get_auto_approve_contact_requests(properties.owner_id) = true
        )
      )
    )
  );

drop policy if exists "owners can read contact authorizations for own properties" on public.property_contact_authorizations;
create policy "owners can read contact authorizations for own properties"
  on public.property_contact_authorizations for select to authenticated
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_contact_authorizations.property_id
        and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "owners can read contacts for own properties" on public.property_contacts;
create policy "owners can read contacts for own properties"
  on public.property_contacts for select to authenticated
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_contacts.property_id
        and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "users can create property interests" on public.property_interest_requests;
create policy "users can create property interests"
  on public.property_interest_requests for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.demand_requests d
      where d.id = property_interest_requests.demand_request_id
        and d.user_id = auth.uid()
    )
    and exists (
      select 1 from public.properties p
      where p.id = property_interest_requests.property_id
        and p.status = 'published'
    )
  );

drop policy if exists "users can read own property interests" on public.property_interest_requests;
create policy "users can read own property interests"
  on public.property_interest_requests for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.properties p
      where p.id = property_interest_requests.property_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "owners can read views for own properties" on public.property_views;
create policy "owners can read views for own properties"
  on public.property_views for select to authenticated
  using (
    exists (
      select 1 from public.properties
      where properties.id = property_views.property_id
        and properties.owner_id = auth.uid()
    )
  );

drop policy if exists "public can register property views" on public.property_views;
create policy "public can register property views"
  on public.property_views for insert to public
  with check (true);

commit;
