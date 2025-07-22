import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { SlArrowDown } from "react-icons/sl";
import axios from "axios";

interface Artwork {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: number;
    date_end: number;
}

const PAGE_SIZE = 10;

export const ArtworksTable = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedRowsMap, setSelectedRowsMap] = useState<{
        [key: number]: Artwork;
    }>({});
    const [selectCount, setSelectCount] = useState<number>(0);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchData = async (pageNum: number) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `https://api.artic.edu/api/v1/artworks?page=${
                    pageNum + 1
                }&limit=${PAGE_SIZE}`
            );
            setArtworks(response.data.data);
            setTotalRecords(response.data.pagination.total);
        } catch (error) {
            console.error("API Error", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData(page);
    }, [page]);

    const onPageChange = (e: DataTablePageEvent) => {
        setPage(e.page ?? 0);
    };

    const onSelectionChange = (e: any) => {
        const currentSelection = e.value as Artwork[];
        const updatedMap = { ...selectedRowsMap };

        artworks.forEach((art) => {
            const found = currentSelection.find((item) => item.id === art.id);
            if (found) {
                updatedMap[art.id] = found;
            } else {
                delete updatedMap[art.id];
            }
        });

        setSelectedRowsMap(updatedMap);
    };

    const isRowSelected = (row: Artwork) => !!selectedRowsMap[row.id];
    const handleSelectRows = async () => {
        const rowsToSelect = selectCount;
        if (rowsToSelect <= 0) return;

        const pagesNeeded = Math.ceil(rowsToSelect / PAGE_SIZE);
        const fetchedArtworks: Artwork[] = [];

        for (let i = 0; i < pagesNeeded; i++) {
            try {
                const res = await axios.get(
                    `https://api.artic.edu/api/v1/artworks?page=${
                        i + 1
                    }&limit=${PAGE_SIZE}`
                );
                fetchedArtworks.push(...res.data.data);

                // Stop fetching if we already have enough
                if (fetchedArtworks.length >= rowsToSelect) break;
            } catch (error) {
                console.error("Error fetching page", i + 1, error);
            }
        }

        const toSelect = fetchedArtworks.slice(0, rowsToSelect);
        const updatedMap = { ...selectedRowsMap };

        toSelect.forEach((art) => {
            updatedMap[art.id] = art;
        });

        setSelectedRowsMap(updatedMap);
        setDropdownVisible(false);
    };

    const handleDocumentClick = (e: MouseEvent) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(e.target as Node)
        ) {
            setDropdownVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleDocumentClick);
        return () =>
            document.removeEventListener("mousedown", handleDocumentClick);
    }, []);

    const renderTitleHeader = () => {
        return (
            <div style={{ position: "relative", display: "inline-block" }}>
                <SlArrowDown
                    style={{ cursor: "pointer" }}
                    onClick={() => setDropdownVisible(!dropdownVisible)}
                />
                <span style={{ marginLeft: "6px", color: "black" }}>Title</span>
                {dropdownVisible && (
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            background: "#fff",
                            border: "1px solid #ccc",
                            padding: "8px",
                            zIndex: 10,
                            width: "140px",
                            marginTop: "4px",
                        }}
                    >
                        <input
                            type="number"
                            placeholder="Select rows..."
                            min={0}
                            max={PAGE_SIZE}
                            onChange={(e) =>
                                setSelectCount(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                padding: "4px",
                                marginBottom: "6px",
                                fontSize: "14px",
                            }}
                        />
                        <button
                            onClick={handleSelectRows}
                            style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "14px",
                                border: "1px solid black",
                                background: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            submit
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="card">
            <h3>Art Institute of Chicago – Artworks Table</h3>

            <DataTable
                value={artworks}
                paginator
                rows={PAGE_SIZE}
                totalRecords={totalRecords}
                lazy
                first={page * PAGE_SIZE}
                onPage={onPageChange}
                loading={loading}
                dataKey="id"
                selection={artworks.filter((item) => isRowSelected(item))}
                onSelectionChange={onSelectionChange}
                selectionMode="multiple"
            >
                <Column
                    selectionMode="multiple"
                    headerStyle={{ width: "3em" }}
                />
                <Column field="title" header={renderTitleHeader()} />
                <Column field="place_of_origin" header="Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Start Year" />
                <Column field="date_end" header="End Year" />
            </DataTable>
        </div>
    );
};
