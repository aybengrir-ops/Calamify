import { Hero } from "@/components/Hero";
import { NewgroundsHub } from "@/components/NewgroundsHub";
import { QuranSection } from "@/components/QuranSection";
import { CollectionsHub } from "@/components/CollectionsSection";
import { MusicSections } from "@/components/MusicSections";
import {
  PersonalizedHome,
  TrendingSection,
  GenresGrid,
  FeaturedPlaylists,
  TopArtists,
  StatsSection,
  PlayerShowcase,
  AppDownload,
  Testimonials,
} from "@/components/HomeSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PersonalizedHome />
      <MusicSections />
      <QuranSection />
      <CollectionsHub group="nasheed" />
      <TrendingSection />
      <NewgroundsHub />
      <GenresGrid limit={24} />
      <FeaturedPlaylists />
      <TopArtists />
      <StatsSection />
      <PlayerShowcase />
      <AppDownload />
      <Testimonials />
    </>
  );
}
