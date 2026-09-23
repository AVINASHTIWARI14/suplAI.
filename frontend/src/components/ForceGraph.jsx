import {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
} from 'react';

import ForceGraph2D from 'react-force-graph-2d';

import companyIcon from '../assets/network/company_suit.png';
import greenIcon from '../assets/network/user_green.png';
import orangeIcon from '../assets/network/user_orange.png';
import redIcon from '../assets/network/user_red.png';

/**
 * Thin wrapper around react-force-graph-2d for the supply-chain network.
 *
 * Props:
 *  - nodes:        [{ id, label, type, risk }]
 *  - links:        [{ source, target, relation }]
 *  - riskFor:      (nodeId) => number
 *  - companyNodeId
 *  - disruptedIds: Set<string>
 *  - highlightLinks: Set<string>
 *  - selectedId
 *  - onNodeClick:  (node) => void
 */

export function nodeColorForRisk(risk) {
  if (risk >= 70) return '#ef4444';
  if (risk >= 40) return '#f59e0b';
  return '#22c55e';
}

const COMPANY_COLOR = '#38bdf8';

const ForceGraph = ({
  nodes,
  links,
  riskFor,
  companyNodeId,
  disruptedIds,
  highlightLinks,
  selectedId,
  onNodeClick,
  height = 460,
}) => {
  const fgRef = useRef();
  const wrapRef = useRef();

  const [width, setWidth] = useState(600);

  /* =========================================================
     LOAD NODE ICONS
     ========================================================= */

  const [icons, setIcons] = useState({
    company: null,
    green: null,
    orange: null,
    red: null,
  });

  useEffect(() => {
    const sources = {
      company: companyIcon,
      green: greenIcon,
      orange: orangeIcon,
      red: redIcon,
    };

    const loaded = {};
    let count = 0;

    Object.entries(sources).forEach(
      ([key, src]) => {
        const image = new Image();

        image.onload = () => {
          loaded[key] = image;
          count += 1;

          if (
            count ===
            Object.keys(sources).length
          ) {
            setIcons(loaded);
          }
        };

        image.src = src;
      },
    );
  }, []);

  /* =========================================================
     MEASURE GRAPH CONTAINER
     ========================================================= */

  useEffect(() => {
    if (!wrapRef.current) {
      return undefined;
    }

    const element = wrapRef.current;

    const measure = () => {
      setWidth(
        element.clientWidth || 600,
      );
    };

    measure();

    const observer =
      new ResizeObserver(measure);

    observer.observe(element);

    return () =>
      observer.disconnect();
  }, []);

  /* =========================================================
     GRAPH DATA
     ========================================================= */

  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(
        (node) => ({
          ...node,
        }),
      ),

      links: links.map(
        (link) => ({
          ...link,
        }),
      ),
    };
  }, [nodes, links]);

  /* =========================================================
     GRAPH PHYSICS
     ========================================================= */

  useEffect(() => {
    if (!fgRef.current) {
      return;
    }

    const fg = fgRef.current;

    /* -------------------------------------------------------
       CHARGE FORCE
       ------------------------------------------------------- */

    const charge =
      fg.d3Force('charge');

    if (charge) {
      /*
       * Increased separation compared
       * with the original clustered layout.
       */
      charge
        .strength(-260)
        .distanceMax(500);
    }

    /* -------------------------------------------------------
       LINK FORCE
       ------------------------------------------------------- */

    const link =
      fg.d3Force('link');

    if (link) {
      /*
       * Gives connected nodes more
       * breathing room.
       */
      link
        .distance(145)
        .strength(0.30);
    }

    /* -------------------------------------------------------
       CENTER FORCE
       ------------------------------------------------------- */

    const center =
      fg.d3Force('center');

    if (center) {
      /*
       * Keep the network generally centered,
       * but don't pull it tightly together.
       */
      center.strength(0.035);
    }

    /*
     * Restart simulation when graph data changes.
     */
    fg.d3ReheatSimulation();
  }, [graphData]);

  /* =========================================================
     GET NODE ICON
     ========================================================= */

  const getNodeIcon =
    useCallback(
      (node, risk) => {
        /*
         * Company always gets suit icon.
         */
        if (
          node.id ===
          companyNodeId
        ) {
          return icons.company;
        }

        /*
         * Supplier icon based on risk.
         */
        if (risk >= 70) {
          return icons.red;
        }

        if (risk >= 40) {
          return icons.orange;
        }

        return icons.green;
      },
      [
        companyNodeId,
        icons,
      ],
    );

  /* =========================================================
     PAINT NODE
     ========================================================= */

  const paintNode =
    useCallback(
      (
        node,
        ctx,
        globalScale,
      ) => {
        const isCompany =
          node.id ===
          companyNodeId;

        const risk = riskFor
          ? riskFor(node.id)
          : node.risk ?? 0;

        const safeRisk =
          Math.min(
            Math.max(
              Number(risk) || 0,
              0,
            ),
            100,
          );

        const disrupted =
          disruptedIds?.has(
            node.id,
          );

        const selected =
          node.id ===
          selectedId;

        const nodeColor =
          isCompany
            ? COMPANY_COLOR
            : nodeColorForRisk(
                safeRisk,
              );

        /* -----------------------------------------------------
           NODE SIZE
           ----------------------------------------------------- */

        const r = isCompany
          ? 17
          : 14 +
            safeRisk / 18;

        /* -----------------------------------------------------
           ICON
           ----------------------------------------------------- */

        const icon =
          getNodeIcon(
            node,
            safeRisk,
          );

        if (icon) {
          const iconWidth =
            r * 2.55;

          const iconHeight =
            r * 2.55;

          ctx.save();

          ctx.imageSmoothingEnabled =
            true;

          ctx.drawImage(
            icon,
            node.x -
              iconWidth / 2,
            node.y -
              iconHeight / 2,
            iconWidth,
            iconHeight,
          );

          ctx.restore();
        } else {
          /*
           * Fallback while images are loading.
           */

          ctx.fillStyle =
            nodeColor;

          ctx.strokeStyle =
            '#ffffff';

          ctx.lineWidth =
            1.5 /
            globalScale;

          ctx.beginPath();

          ctx.arc(
            node.x,
            node.y,
            r,
            0,
            2 * Math.PI,
          );

          ctx.fill();

          ctx.stroke();
        }

        /* -----------------------------------------------------
           DISRUPTED RING
           ----------------------------------------------------- */

        if (disrupted) {
          ctx.save();

          ctx.beginPath();

          ctx.arc(
            node.x,
            node.y,
            r + 7,
            0,
            2 * Math.PI,
          );

          ctx.lineWidth =
            2.5 /
            globalScale;

          ctx.strokeStyle =
            '#f43f5e';

          ctx.setLineDash([
            3 / globalScale,
            3 / globalScale,
          ]);

          ctx.stroke();

          ctx.setLineDash([]);

          ctx.restore();
        }

        /* -----------------------------------------------------
           SELECTED RING
           ----------------------------------------------------- */

        if (selected) {
          ctx.save();

          ctx.beginPath();

          ctx.arc(
            node.x,
            node.y,
            r + 10,
            0,
            2 * Math.PI,
          );

          ctx.lineWidth =
            2 /
            globalScale;

          ctx.strokeStyle =
            '#f4c400';

          ctx.stroke();

          ctx.restore();
        }

        /* -----------------------------------------------------
           LABELS
           ----------------------------------------------------- */

        const label =
          node.label ||
          node.id;

       const fontSize =
  Math.max(
    13 / globalScale,
    4.5,
  );

const detailSize =
  Math.max(
    10 / globalScale,
    3.5,
  );

        ctx.textAlign =
          'center';

        ctx.textBaseline =
          'top';

        if (
          globalScale >
          0.55
        ) {
          /*
           * Main name
           */

          ctx.font =
            `700 ${fontSize}px 'PT Serif', Georgia, serif`;

          ctx.fillStyle =
            '#ffffff';

          ctx.fillText(
            label,
            node.x,
            node.y +
              r +
              5,
          );

          /*
           * Type + risk
           */

          ctx.font =
            `${detailSize}px 'JetBrains Mono', monospace`;

          ctx.fillStyle =
            '#f5f5f5';

          const typeLabel =
            isCompany
              ? 'COMPANY'
              : (
                  node.type ||
                  'SUPPLIER'
                ).toUpperCase();

          ctx.fillText(
            `${typeLabel} · RISK ${Math.round(
              safeRisk,
            )}`,
            node.x,
            node.y +
              r +
              fontSize +
              7,
          );
        }
      },
      [
        companyNodeId,
        riskFor,
        disruptedIds,
        selectedId,
        getNodeIcon,
      ],
    );

  /* =========================================================
     LINK COLOR
     ========================================================= */

  const linkColor =
    useCallback(
      (link) => {
        const key =
          `${
            typeof link.source ===
            'object'
              ? link.source.id
              : link.source
          }>${
            typeof link.target ===
            'object'
              ? link.target.id
              : link.target
          }`;

        /*
         * Highlighted cascade links.
         */
        if (
          highlightLinks?.has(
            key,
          )
        ) {
          return '#f4c400';
        }

        return 'rgba(255,255,255,0.65)';
      },
      [highlightLinks],
    );

  /* =========================================================
     LINK WIDTH
     ========================================================= */

  const linkWidth =
    useCallback(
      (link) => {
        const key =
          `${
            typeof link.source ===
            'object'
              ? link.source.id
              : link.source
          }>${
            typeof link.target ===
            'object'
              ? link.target.id
              : link.target
          }`;

        return highlightLinks?.has(
          key,
        )
          ? 2.8
          : 1.4;
      },
      [highlightLinks],
    );

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div
      className="force-graph-wrap"
      ref={wrapRef}
      style={{
        height,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="force-graph-grid"
        aria-hidden="true"
      />

      <ForceGraph2D
        ref={fgRef}

        width={width}

        height={height}

        graphData={graphData}

        backgroundColor="rgba(0,0,0,0)"

        /* =====================================================
           NODE
           ===================================================== */

        nodeRelSize={6}

        nodeCanvasObject={
          paintNode
        }

        nodePointerAreaPaint={(
          node,
          color,
          ctx,
        ) => {
          const risk =
            riskFor
              ? riskFor(
                  node.id,
                )
              : node.risk ??
                0;

          const isCompany =
            node.id ===
            companyNodeId;

          const r =
            isCompany
              ? 22
              : 20 +
                Math.min(
                  Math.max(
                    Number(
                      risk,
                    ) || 0,
                    0,
                  ),
                  100,
                ) /
                  20;

          ctx.fillStyle =
            color;

          ctx.beginPath();

          ctx.arc(
            node.x,
            node.y,
            r,
            0,
            2 * Math.PI,
          );

          ctx.fill();
        }}

        /* =====================================================
           LINKS
           ===================================================== */

        linkColor={
          linkColor
        }

        linkWidth={
          linkWidth
        }

        linkDirectionalArrowLength={
          5
        }

        linkDirectionalArrowRelPos={
          0.82
        }

        linkDirectionalArrowColor={
          linkColor
        }

        /* =====================================================
           CASCADE PARTICLES
           ===================================================== */

        linkDirectionalParticles={(
          link,
        ) => {
          const key =
            `${
              typeof link.source ===
              'object'
                ? link.source.id
                : link.source
            }>${
              typeof link.target ===
              'object'
                ? link.target.id
                : link.target
            }`;

          return highlightLinks?.has(
            key,
          )
            ? 3
            : 0;
        }}

        linkDirectionalParticleColor={() =>
          '#f4c400'
        }

        linkDirectionalParticleWidth={
          2
        }

        /* =====================================================
           INTERACTION
           ===================================================== */

        onNodeClick={
          onNodeClick
        }

        /* =====================================================
           STABLE SIMULATION
           ===================================================== */

        cooldownTicks={100}

        d3VelocityDecay={0.6}

        warmupTicks={30}

        height={height}
      />
    </div>
  );
};

export default ForceGraph;