"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import {
	CircleMarker,
	MapContainer,
	Marker,
	TileLayer,
	useMap,
} from "react-leaflet";
import { Compass, LocateFixed, Minus, Plus } from "lucide-react";
import { useToast } from "@/components/toast";
import { getMemoryTypeOption } from "@/lib/memory-map";
import type { MemoryMapEntry } from "@/lib/types";
import { primaryButtonClass } from "./shared-classes";

interface LeafletMemoryMapProps {
	memories: MemoryMapEntry[];
	onEditMemory: (memory: MemoryMapEntry) => void;
	onNewMemory: () => void;
}

const defaultCenter: LatLngExpression = [8.4, 103.8];
const defaultZoom = 5;

function getMemoryBounds(memories: MemoryMapEntry[]) {
	if (!memories.length) return null;

	return memories.map((memory) => [
		memory.latitude,
		memory.longitude,
	]) as LatLngBoundsExpression;
}

function createEmojiIcon(memory: MemoryMapEntry) {
	const option = getMemoryTypeOption(memory.memory_type);
	const escapedTitle = memory.title
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

	return L.divIcon({
		className: "memory-map-pin-wrapper",
		html: `
      <div class="memory-map-pin" aria-label="${escapedTitle}">
        <div class="memory-map-pin-bubble">${option.emoji}</div>
        <div class="memory-map-pin-tip"></div>
        <div class="memory-map-pin-label">${escapedTitle}</div>
      </div>
    `,
		iconAnchor: [24, 55],
		iconSize: [48, 58],
	});
}

function FitMemoryBounds({ memories }: { memories: MemoryMapEntry[] }) {
	const map = useMap();
	const bounds = useMemo(() => getMemoryBounds(memories), [memories]);

	useEffect(() => {
		if (!bounds) {
			map.setView(defaultCenter, defaultZoom);
			return;
		}

		map.fitBounds(bounds, {
			animate: true,
			maxZoom: 14,
			padding: [48, 48],
		});
	}, [bounds, map]);

	return null;
}

function MapControls({ memories }: { memories: MemoryMapEntry[] }) {
	const map = useMap();
	const toast = useToast();
	const [locating, setLocating] = useState(false);
	const [currentLocation, setCurrentLocation] =
		useState<LatLngExpression | null>(null);

	const fitToMemories = () => {
		const bounds = getMemoryBounds(memories);
		if (!bounds) {
			map.setView(defaultCenter, defaultZoom);
			return;
		}

		map.fitBounds(bounds, {
			animate: true,
			maxZoom: 14,
			padding: [48, 48],
		});
	};

	const locateCurrentPosition = () => {
		if (!navigator.geolocation) {
			toast("Current location is not available in this browser.", {
				variant: "error",
			});
			return;
		}

		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const nextLocation: LatLngExpression = [
					position.coords.latitude,
					position.coords.longitude,
				];

				setCurrentLocation(nextLocation);
				map.setView(nextLocation, Math.max(map.getZoom(), 15), {
					animate: true,
				});
				setLocating(false);
			},
			(error) => {
				setLocating(false);
				toast(error.message || "Could not get your current location.", {
					variant: "error",
				});
			},
			{
				enableHighAccuracy: true,
				maximumAge: 30000,
				timeout: 10000,
			},
		);
	};

	return (
		<>
			<div
				className="absolute right-4 top-4 z-[500] grid gap-2 sm:right-5 sm:top-5"
				onPointerDown={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					aria-label="Zoom in"
					className="grid size-10 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur transition hover:bg-mui/10 hover:text-mui"
					onClick={() => map.zoomIn()}
				>
					<Plus size={18} />
				</button>
				<button
					type="button"
					aria-label="Zoom out"
					className="grid size-10 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur transition hover:bg-mui/10 hover:text-mui"
					onClick={() => map.zoomOut()}
				>
					<Minus size={18} />
				</button>
				<button
					type="button"
					aria-label="Fit all memories"
					className="grid size-10 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur transition hover:bg-mui/10 hover:text-mui"
					onClick={fitToMemories}
				>
					<Compass size={18} />
				</button>
				<button
					type="button"
					aria-label="Use current location"
					disabled={locating}
					className="grid size-10 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur transition hover:bg-mui/10 hover:text-mui disabled:opacity-60"
					onClick={locateCurrentPosition}
				>
					<LocateFixed size={18} />
				</button>
			</div>
			{currentLocation ? (
				<CircleMarker
					center={currentLocation}
					radius={8}
					pathOptions={{
						className: "memory-map-current-location",
						color: "#ffffff",
						fillColor: "#3b82f6",
						fillOpacity: 1,
						weight: 2,
					}}
				/>
			) : null}
		</>
	);
}

export function LeafletMemoryMap({
	memories,
	onEditMemory,
	onNewMemory,
}: LeafletMemoryMapProps) {
	return (
		// <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-paper p-2 shadow-md sm:p-4">
			<div className="relative min-h-[22rem] overflow-hidden rounded-2xl sm:min-h-[31rem] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
				<MapContainer
					center={defaultCenter}
					zoom={defaultZoom}
					minZoom={2}
					maxZoom={18}
					scrollWheelZoom
					touchZoom
					dragging
          zoomControl={false}
          attributionControl={false}
					className="absolute inset-0 z-0 h-full w-full"
				>
					<TileLayer
						attribution=""
						url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
					/>
					<FitMemoryBounds memories={memories} />
					<MapControls memories={memories} />
					{memories.map((memory) => (
						<Marker
							key={memory.id}
							position={[memory.latitude, memory.longitude]}
							icon={createEmojiIcon(memory)}
							eventHandlers={{
								click: () => onEditMemory(memory),
							}}
						/>
					))}
				</MapContainer>

				<div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.16),transparent_28%,rgba(255,255,255,0.14))]" />

				{!memories.length ? (
					<div className="absolute inset-0 z-[40] grid place-items-center px-5 text-center">
						<div className="max-w-sm rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur">
							<div className="mx-auto grid size-12 place-items-center rounded-full bg-mui/10 text-mui">
								<Compass size={22} />
							</div>
							<p className="mt-3 font-serif text-2xl text-neutral-950">
								No places yet
							</p>
							<p className="mt-2 text-sm leading-6 text-neutral-600">
								Add the first place you spent together
							</p>
							<button
								type="button"
								className={`${primaryButtonClass} mt-4 w-full justify-center`}
								onClick={onNewMemory}
							>
								Add memory
							</button>
						</div>
					</div>
				) : null}
			</div>
		// </div>
	);
}
