-- DEMONSTRATION DATA ONLY — not Semsem's real menu, prices are NOT official.
-- Every row is flagged is_demo = true. Delete them once the real menu exists:
--   delete from public.menu_items where is_demo;

with c as (
  insert into public.menu_categories (slug, name_ar, name_en, blurb_ar, sort_order) values
    ('ful', 'الفول', 'Ful', 'الفول هو الأساس.. اختار نوعك.', 1),
    ('taameya', 'الطعمية', 'Ta''ameya', 'مقرمشة من بره، خضرا من جوه.', 2),
    ('mezze', 'المقبلات', 'Mezze', 'الحاجات اللي بتحلّي الطبق.', 3),
    ('fries', 'البطاطس والمقلي', 'Fries & fried', 'سخن وطالع من الزيت على طول.', 4),
    ('drinks', 'المشروبات', 'Drinks', 'كوباية تقعّدك ساعة زيادة.', 5)
  returning id, slug
)
insert into public.menu_items (category_id, name_ar, name_en, description_ar, price, image_url, sort_order, is_available, tags, is_demo)
select c.id, v.name_ar, v.name_en, v.descr, v.price, v.img, v.ord, v.avail, v.tags, true
from c
join (values
  ('ful', 'فول بالزيت الحار', 'Ful medames', 'فول مدمّس بالزيت والكمون وعصرة ليمون.', 25, '/images/ful.webp', 1, true, array['سحور','ساخن','الأشهر']),
  ('ful', 'فول بالطحينة', 'Ful with tahini', 'فول مدمّس بالطحينة وشوية زيت.', 30, '/images/ful-bowl.webp', 2, true, array['سحور','ساخن']),
  ('ful', 'فول بالبيض', 'Ful with egg', 'فول مدمّس جنبه بيض مسلوق.', 35, '/images/eggs.webp', 3, true, array['سحور','ساخن']),
  ('ful', 'فول بالسمنة', 'Ful with ghee', 'فول مدمّس بالسمنة البلدي.', 35, '/images/ful-bowl.webp', 4, false, array['سحور','ساخن']),
  ('taameya', 'طعمية', 'Ta''ameya', 'أقراص طعمية مقرمشة من بره وخضرا من جوه.', 20, '/images/falafel.webp', 1, true, array['سحور','ساخن','الأشهر']),
  ('taameya', 'طعمية بالطحينة', 'Ta''ameya & tahini', 'طعمية جنبها طبق طحينة.', 30, '/images/falafel-dip.webp', 2, true, array['ساخن']),
  ('taameya', 'ساندوتش طعمية', 'Ta''ameya sandwich', 'طعمية في عيش سخن مع سلطة.', 25, '/images/falafel.webp', 3, true, array['ساخن']),
  ('mezze', 'بابا غنوج', 'Baba ghanoush', 'بتنجان مشوي مهروس بالطحينة، مع عيش.', 35, '/images/baba.webp', 1, true, array['مقبلات']),
  ('mezze', 'بتنجان مشوي بالطماطم', 'Grilled eggplant', 'بتنجان مشوي مع طماطم وتتبيلة.', 35, '/images/eggplant-grilled.webp', 2, true, array['ساخن']),
  ('mezze', 'سلطة خضرا', 'Green salad', 'سلطة خضرا طازة.', 20, '/images/salad.webp', 3, true, array['بارد']),
  ('mezze', 'مخلل', 'Pickles', 'طبق مخلل مشكّل.', 10, '/images/pickles.webp', 4, true, array['بارد']),
  ('fries', 'بطاطس محمرة', 'Fries', 'بطاطس مقرمشة، تتاكل لوحدها أو جوه الساندوتش.', 25, '/images/fries.webp', 1, true, array['ساخن','للتشارك']),
  ('fries', 'بتنجان مقلي', 'Fried eggplant', 'شرايح بتنجان مقلية.', 25, '/images/eggplant-fried.webp', 2, true, array['ساخن']),
  ('drinks', 'شاي بالنعناع', 'Mint tea', 'شاي سخن بنعناع طازة.', 15, '/images/mint-tea.webp', 1, true, array['ساخن']),
  ('drinks', 'شاي', 'Tea', 'الشاي الأحمر بالطريقة الكلاسيكية.', 12, '/images/tea.webp', 2, true, array['ساخن']),
  ('drinks', 'قهوة', 'Coffee', 'قهوة سادة أو مظبوط.', 25, '/images/coffee.webp', 3, true, array['ساخن']),
  ('drinks', 'بيبسي', 'Soda', 'مشروب غازي بارد.', 15, null, 4, true, array['بارد'])
) as v(cat, name_ar, name_en, descr, price, img, ord, avail, tags) on v.cat = c.slug;

insert into public.site_settings (key, value) values
  ('menuIsSample', 'true'::jsonb),
  ('locationText', null),
  ('mapsUrl', null),
  ('hoursText', null),
  ('phone', null),
  ('whatsapp', null),
  ('instagram', null)
on conflict (key) do nothing;
