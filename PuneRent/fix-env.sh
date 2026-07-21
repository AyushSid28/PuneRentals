while IFS='=' read -r key value; do
  if [[ -n "$key" && "$key" != \#* ]]; then
    # Remove quotes and \n
    clean_val=$(echo "$value" | sed 's/^"//;s/"$//' | sed 's/\\n$//')
    if [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" || "$key" == "NEXT_PUBLIC_SUPABASE_ANON_KEY" || "$key" == "SUPABASE_SERVICE_ROLE_KEY" ]]; then
       echo "Fixing $key"
       echo -n "$clean_val" | npx vercel env rm "$key" production -y
       echo -n "$clean_val" | npx vercel env add "$key" production
    fi
  fi
done < .env.production
