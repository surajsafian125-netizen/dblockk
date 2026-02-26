import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const viewsData = [
  { name: 'Mon', views: 4000 },
  { name: 'Tue', views: 3000 },
  { name: 'Wed', views: 5000 },
  { name: 'Thu', views: 4500 },
  { name: 'Fri', views: 6000 },
  { name: 'Sat', views: 8000 },
  { name: 'Sun', views: 7500 },
];

const categoryData = [
  { name: 'News', value: 4500 },
  { name: 'Hustle', value: 3800 },
  { name: 'Vibes', value: 3200 },
];

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Views', value: '124.5K', icon: Eye, change: '+12.5%' },
    { label: 'Total Users', value: '8,432', icon: Users, change: '+8.2%' },
    { label: 'Engagement', value: '78.3%', icon: Activity, change: '+5.1%' },
    { label: 'Growth', value: '+23%', icon: TrendingUp, change: '+3.4%' },
  ]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data } = await supabase
        .from('analytics_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setStats([
          { label: 'Total Views', value: data.total_views || '0', icon: Eye, change: data.views_change || '+0%' },
          { label: 'Total Users', value: data.total_users || '0', icon: Users, change: data.users_change || '+0%' },
          { label: 'Engagement', value: data.engagement_rate || '0%', icon: Activity, change: data.engagement_change || '+0%' },
          { label: 'Growth', value: data.growth || '0%', icon: TrendingUp, change: data.growth_change || '+0%' },
        ]);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl font-bold mb-8 text-center"
      >
        Platform <span className="text-primary text-glow">Analytics</span>
      </motion.h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass glow rounded-2xl p-5 text-center"
          >
            <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
              className="font-display text-2xl md:text-3xl font-bold block"
            >
              {stat.value}
            </motion.span>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            <span className="text-xs text-primary">{stat.change}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass glow rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold mb-4">Views Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(220, 25%, 10%)', border: '1px solid hsl(190, 95%, 55%, 0.2)', borderRadius: '12px', color: 'hsl(210, 20%, 95%)' }} />
              <Line type="monotone" dataKey="views" stroke="hsl(190, 95%, 55%)" strokeWidth={2} dot={{ fill: 'hsl(190, 95%, 55%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass glow rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(220, 25%, 10%)', border: '1px solid hsl(190, 95%, 55%, 0.2)', borderRadius: '12px', color: 'hsl(210, 20%, 95%)' }} />
              <Bar dataKey="value" fill="hsl(190, 95%, 55%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass glow rounded-2xl p-6 mt-6"
      >
        <h3 className="font-display font-semibold mb-4">Trending Pulse</h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }, (_, i) => {
            const intensity = Math.random();
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.02 }}
                className="aspect-square rounded-lg"
                style={{
                  background: `hsl(190, 95%, 55%, ${intensity * 0.6 + 0.05})`,
                  boxShadow: intensity > 0.7 ? `0 0 10px hsl(190, 95%, 55%, ${intensity * 0.3})` : 'none',
                }}
              />
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default AnalyticsDashboard;
