const fs = require('fs');
let content = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');

const replaceStr = `      if (!error && data) {
        setSubmissions(data);
      }

      setLoading(false);

      // Set up Realtime subscription
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'telemetry_events',
            filter: \`user_id=eq.\${uid}\`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            setSubmissions((prevSubmissions) => {
              return prevSubmissions.map((sub) =>
                sub.id === payload.new.id ? { ...sub, ...payload.new } : sub
              );
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = fetchProfileData();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);`;

content = content.replace(
  `      if (!error && data) {
        setSubmissions(data);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, []);`,
  replaceStr
);

fs.writeFileSync('src/pages/ProfilePage.jsx', content);
