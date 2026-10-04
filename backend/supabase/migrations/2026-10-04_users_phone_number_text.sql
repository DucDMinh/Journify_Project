alter table public.users
    alter column phone_number type text
    using case
        when phone_number is null then null
        when length(phone_number::text) = 9 then '0' || phone_number::text
        else phone_number::text
    end;
