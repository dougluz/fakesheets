const workerCode = `
const columnGenerators = {
  firstName: () => faker.person.firstName(),
  lastName: () => faker.person.lastName(),
  fullName: () => faker.person.fullName(),
  email: () => faker.internet.email(),
  phone: () => faker.phone.number(),
  company: () => faker.company.name(),
  jobTitle: () => faker.person.jobTitle(),
  address: () => faker.location.streetAddress(),
  city: () => faker.location.city(),
  country: () => faker.location.country(),
  website: () => faker.internet.url(),
  avatarUrl: () => faker.image.avatar(),
};

function generateChunk(assignment) {
  const { startRow, endRow, config } = assignment;
  const generators = config.columns.map(
    (key) => columnGenerators[key] || (() => "")
  );
  const rowCount = endRow - startRow;
  const rows = [];

  for (let i = 0; i < rowCount; i++) {
    const row = new Array(generators.length);
    for (let j = 0; j < generators.length; j++) {
      row[j] = generators[j]();
    }
    rows.push(row);
  }

  return rows;
}

function handlePreview(config, columnLabels) {
  const headers = config.columns.map((key) => columnLabels[key] || key);
  const generators = config.columns.map(
    (key) => columnGenerators[key] || (() => "")
  );

  const rows = [];
  for (let i = 0; i < 5; i++) {
    const row = new Array(generators.length);
    for (let j = 0; j < generators.length; j++) {
      row[j] = generators[j]();
    }
    rows.push(row);
  }

  self.postMessage({ type: "preview", headers, rows });
}

self.onmessage = (e) => {
  try {
    const input = e.data;

    if (input.preview) {
      handlePreview(input, input.columnLabels);
      return;
    }

    const rows = generateChunk(input);
    self.postMessage({ type: "chunk_complete", chunkIndex: input.chunkIndex, rows });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message || "Unknown error occurred",
    });
  }
};
`;

export function createWorkerBlobURL(): string {
  const importStatement = `import { faker } from 'https://cdn.jsdelivr.net/npm/@faker-js/faker@10.3.0/+esm';\n`;
  const fullCode = importStatement + workerCode;
  const blob = new Blob([fullCode], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}
