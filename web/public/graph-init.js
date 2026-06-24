document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cy');
  if (!container) return;

  cytoscape.use(cytoscapeFcose);

  const res = await fetch('../../static/graph.json');
  const graph = await res.json();

  const categoryColors = {
    concepts: '#2f6f4f',
    entities: '#1f6feb',
    practices: '#b45309',
    sources: '#6b7280',
    syntheses: '#7c3aed',
    null: '#94a3b8',
  };

  const degreeMap = {};
  graph.edges.forEach(e => {
    degreeMap[e.source] = (degreeMap[e.source] || 0) + 1;
    degreeMap[e.target] = (degreeMap[e.target] || 0) + 1;
  });

  const elements = [
    ...graph.nodes.map(n => ({
      data: {
        id: n.id,
        label: n.label,
        url: n.url,
        color: categoryColors[n.category] || '#94a3b8',
        degree: degreeMap[n.id] || 0,
      }
    })),
    ...graph.edges.map(e => ({
      data: { source: e.source, target: e.target }
    }))
  ];

  const cy = cytoscape({
    container,
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': 'data(color)',
          'border-width': 1.5,
          'border-color': 'data(color)',
          'border-opacity': 0.4,
          'color': '#e2e8f0',
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          'font-size': '10px',
          'text-valign': 'bottom',
          'text-margin-y': 5,
          'text-max-width': '100px',
          'text-wrap': 'ellipsis',
          'text-opacity': 0,
          'text-background-color': '#0f172a',
          'text-background-opacity': 0.75,
          'text-background-padding': '2px',
          'text-background-shape': 'round-rectangle',
          'width': 'mapData(degree, 0, 30, 14, 44)',
          'height': 'mapData(degree, 0, 30, 14, 44)',
          'min-zoomed-font-size': 12,
          'cursor': 'pointer',
        }
      },
      {
        selector: 'node[degree >= 12]',
        style: {
          'text-opacity': 1,
          'font-weight': 'bold',
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 0.5,
          'line-color': '#475569',
          'opacity': 0.2,
          'curve-style': 'haystack',
          'haystack-radius': 0.5,
        }
      },
      {
        selector: 'node.faded',
        style: {
          'opacity': 0.15,
          'text-opacity': 0,
        }
      },
      {
        selector: 'edge.faded',
        style: {
          'opacity': 0.05,
        }
      },
      {
        selector: 'node.highlighted',
        style: {
          'opacity': 1,
          'text-opacity': 1,
          'underlay-color': 'data(color)',
          'underlay-opacity': 0.15,
          'underlay-padding': 6,
          'underlay-shape': 'ellipse',
          'font-size': '11px',
          'z-index': 10,
        }
      },
      {
        selector: 'edge.highlighted',
        style: {
          'opacity': 0.8,
          'width': 1.5,
          'line-color': '#94a3b8',
          'z-index': 10,
        }
      },
      {
        selector: 'node:active',
        style: { 'overlay-opacity': 0 }
      }
    ],
    layout: {
      name: 'fcose',
      quality: 'default',
      randomize: true,
      animate: 'end',
      animationDuration: 400,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: () => 100000,
      idealEdgeLength: () => 250,
      edgeElasticity: () => 0.1,
      gravity: 0.02,
      gravityRange: 1.5,
      numIter: 5000,
      tile: true,
      tilingPaddingVertical: 40,
      tilingPaddingHorizontal: 40,
      nodeSeparation: 200,
    },
    minZoom: 0.2,
    maxZoom: 4,
    pixelRatio: 1,
  });

  let highlightTimeout;

  cy.on('mouseover', 'node', (e) => {
    clearTimeout(highlightTimeout);
    const node = e.target;
    const neighborhood = node.neighborhood().add(node);
    cy.elements().addClass('faded');
    neighborhood.removeClass('faded').addClass('highlighted');
  });

  cy.on('mouseout', 'node', () => {
    highlightTimeout = setTimeout(() => {
      cy.elements().removeClass('faded highlighted');
    }, 150);
  });

  cy.on('tap', 'node', (evt) => {
    const url = evt.target.data('url');
    if (url) window.location.href = url;
  });
});
