"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button/button";
import { ArrowIcon } from "@/components/icons/arrow-icon";
import { BadgeIcon, BoltIcon } from "@/components/icons";
import { FOODS, GOOD_IDS, BAD_IDS } from "@/lib/game/foods";
import styles from "./how-to-play-content.module.scss";

function Key({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  // `label` gives icon-only arrow keys an accessible name (the SVG is
  // aria-hidden); text keys like "R" are announced from their content.
  return (
    <kbd className={styles.key} aria-label={label}>
      {children}
    </kbd>
  );
}

function FoodChips({ ids, kind }: { ids: string[]; kind: "good" | "bad" }) {
  return (
    <ul className={styles.chips}>
      {ids.map((id) => {
        const f = FOODS[id];
        const label = kind === "good" ? `+${f.points}` : `${f.points}`;
        return (
          <li key={id} className={styles.chip}>
            <span className={styles.chipIcon}>{f.icon}</span>
            <span className={kind === "good" ? styles.chipGood : styles.chipBad}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Controls() {
  const t = useTranslations("howToPlay");
  return (
    <ul className={styles.controls}>
      <li>
        <span className={styles.keys}>
          <Key label="←">
            <ArrowIcon dir="left" />
          </Key>
          <Key label="→">
            <ArrowIcon dir="right" />
          </Key>
        </span>
        {t("controlsLanes")}
      </li>
      <li>
        <span className={styles.keys}>
          <Key label="↑">
            <ArrowIcon dir="up" />
          </Key>
        </span>
        {t("controlsSprint")}
      </li>
      <li>
        <span className={styles.keys}>
          <Key label="↓">
            <ArrowIcon dir="down" />
          </Key>
        </span>
        {t("controlsBrake")}
      </li>
      <li>
        <span className={styles.keys}>
          <Key>R</Key>
        </span>
        {t("controlsRestart")}
      </li>
      <li>
        <span className={styles.keys}>
          <Key label="Boost">
            <BoltIcon size={18} />
          </Key>
        </span>
        {t("controlsBoost")}
      </li>
      <li>
        <span className={styles.keys}>
          <Key label="Power">
            <BadgeIcon size={18} />
          </Key>
        </span>
        {t("controlsPower")}
      </li>
    </ul>
  );
}

export function HowToPlayContent() {
  const t = useTranslations("howToPlay");
  const reduce = useReducedMotion();

  const card = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.4,
            delay: 0.1 + i * 0.07,
            ease: "easeOut" as const,
          },
        };

  const intro = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay },
        };

  return (
    <div className={styles.page}>
      <motion.h1 className={styles.title} {...intro(0)}>
        {t("title")}
      </motion.h1>
      <motion.p className={styles.intro} {...intro(0.05)}>
        {t("intro")}
      </motion.p>

      <div className={styles.grid}>
        <motion.article className={styles.card} {...card(0)}>
          <h2 className={styles.cardTitle}>{t("goalTitle")}</h2>
          <p className={styles.cardText}>{t("goalText")}</p>
        </motion.article>

        <motion.article className={styles.card} {...card(1)}>
          <h2 className={styles.cardTitle}>{t("energyTitle")}</h2>
          <p className={styles.cardText}>{t("energyText")}</p>
          <FoodChips ids={GOOD_IDS} kind="good" />
        </motion.article>

        <motion.article className={styles.card} {...card(2)}>
          <h2 className={styles.cardTitle}>{t("poisonTitle")}</h2>
          <p className={styles.cardText}>{t("poisonText")}</p>
          <FoodChips ids={BAD_IDS} kind="bad" />
        </motion.article>

        <motion.article className={styles.card} {...card(3)}>
          <h2 className={styles.cardTitle}>{t("controlsTitle")}</h2>
          <Controls />
        </motion.article>

        <motion.article className={styles.card} {...card(4)}>
          <h2 className={styles.cardTitle}>{t("zapTitle")}</h2>
          <p className={styles.cardText}>{t("zapText")}</p>
        </motion.article>

        <motion.article className={styles.card} {...card(5)}>
          <h2 className={styles.cardTitle}>{t("rankingTitle")}</h2>
          <p className={styles.cardText}>{t("rankingText")}</p>
        </motion.article>
      </div>

      <motion.div className={styles.actions} {...intro(0.6)}>
        <Button href="/demo" variant="outline" size="lg">
          {t("demo")}
        </Button>
        <Button href="/play" size="lg">
          {t("cta")}
        </Button>
      </motion.div>
    </div>
  );
}

export default HowToPlayContent;
