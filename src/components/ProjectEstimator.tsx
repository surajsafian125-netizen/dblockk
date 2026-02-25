import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const ProjectEstimator = () => {
  const [pages, setPages] = useState([5]);
  const [seo, setSeo] = useState([3]);
  const [ai, setAi] = useState([2]);
  const [ecommerce, setEcommerce] = useState([1]);

  const basePrices = { pages: 200, seo: 500, ai: 800, ecommerce: 1000 };
  const total =
    pages[0] * basePrices.pages +
    seo[0] * basePrices.seo +
    ai[0] * basePrices.ai +
    ecommerce[0] * basePrices.ecommerce;

  const sliders = [
    { label: 'Number of Pages', value: pages, onChange: setPages, max: 20, price: pages[0] * basePrices.pages },
    { label: 'SEO Depth', value: seo, onChange: setSeo, max: 10, price: seo[0] * basePrices.seo },
    { label: 'AI Integration', value: ai, onChange: setAi, max: 5, price: ai[0] * basePrices.ai },
    { label: 'E-commerce Features', value: ecommerce, onChange: setEcommerce, max: 5, price: ecommerce[0] * basePrices.ecommerce },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl font-bold mb-8 text-center"
      >
        Project <span className="text-primary text-glow">Estimator</span>
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass glow rounded-2xl p-8 max-w-2xl mx-auto"
      >
        <div className="space-y-8">
          {sliders.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium">{s.label}</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Level {s.value[0]}</span>
                  <span className="text-sm font-semibold text-primary">${s.price.toLocaleString()}</span>
                </div>
              </div>
              <Slider
                value={s.value}
                onValueChange={s.onChange}
                max={s.max}
                min={1}
                step={1}
                className="w-full"
              />
            </motion.div>
          ))}
        </div>

        <motion.div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="font-display text-lg">Estimated Total</span>
            <motion.span
              key={total}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-4xl font-bold text-primary text-glow"
            >
              ${total.toLocaleString()}
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ProjectEstimator;