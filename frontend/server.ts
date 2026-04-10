import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import duckdb from 'duckdb';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DuckDB connection
const dbPath = path.resolve(process.cwd(), '../starc.duckdb');
console.log(`Connecting to DuckDB at ${dbPath}`);
// DuckDB opens the file in read-only mode to prevent locking issues if other processes use it
const db = new duckdb.Database(dbPath, duckdb.OPEN_READONLY);
const conn = db.connect();

const runQuery = (query: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        conn.all(query, (err, res) => {
            if (err) {
                console.error('Query error:', err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

// API Endpoints

app.get('/api/metrics', async (req, res) => {
    try {
        const totalQuery = 'SELECT COUNT(*) as value FROM exoplanets;';
        const total = await runQuery(totalQuery);

        const hostQuery = 'SELECT COUNT(DISTINCT hostname) as value FROM exoplanets WHERE hostname IS NOT NULL;';
        const hosts = await runQuery(hostQuery);

        const methodsQuery = 'SELECT COUNT(DISTINCT discoverymethod) as value FROM exoplanets WHERE discoverymethod IS NOT NULL;';
        const methods = await runQuery(methodsQuery);

        const firstYearQuery = 'SELECT MIN(disc_year) as value FROM exoplanets;';
        const firstYear = await runQuery(firstYearQuery);

        const validationQuery = `
      SELECT 
        (SELECT COUNT(*) FROM read_csv_auto('../data/processed/starc_sky_validation.csv') WHERE status = 'OK') as valid,
        (SELECT COUNT(*) FROM read_csv_auto('../data/processed/starc_sky_validation.csv')) as total
      `;
        let validationStr = 'N/A';
        try {
            const validation = await runQuery(validationQuery);
            if (validation.length > 0) {
                validationStr = `${validation[0].valid}/${validation[0].total}`;
            }
        } catch (e) {
            console.warn("Validation file might not exist yet.");
        }

        res.json({
            exoplanets: total[0].value.toString(),
            hosts: hosts[0].value.toString(),
            methods: methods[0].value.toString() + '+',
            firstYear: firstYear[0].value.toString(),
            validation: validationStr
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

app.get('/api/discovery-methods', async (req, res) => {
    try {
        const query = `
      SELECT discoverymethod as name, COUNT(*) as value
      FROM exoplanets
      WHERE discoverymethod IS NOT NULL
      GROUP BY discoverymethod
      ORDER BY value DESC
      LIMIT 10;
    `;
        const data = await runQuery(query);
        res.json(data.map(d => ({ name: d.name, value: Number(d.value) })));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/timeline', async (req, res) => {
    try {
        const query = `
      SELECT disc_year as year, COUNT(*) as discoveries
      FROM exoplanets
      WHERE disc_year IS NOT NULL
      GROUP BY disc_year
      ORDER BY disc_year;
    `;
        const data = await runQuery(query);

        // Create cumulative discoveries
        let cumulative = 0;
        const result = data.map(d => {
            cumulative += Number(d.discoveries);
            return { year: d.year.toString(), value: cumulative };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/habitable-zone', async (req, res) => {
    try {
        const query = `
      SELECT 
        ROUND(pl_eqt, 1) as x, 
        ROUND(pl_rade, 2) as y, 
        sy_dist as z,
        pl_name as name
      FROM exoplanets
      WHERE pl_eqt BETWEEN 200 AND 350
        AND pl_rade < 2.0
      LIMIT 100;
    `;
        const data = await runQuery(query);
        res.json(data.map(d => ({
            x: Number(d.x),
            y: Number(d.y),
            z: Number(d.z) || 50,
            name: d.name
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/radius-distribution', async (req, res) => {
    try {
        const query = `
      SELECT
        CASE
          WHEN pl_rade < 1 THEN '0-1'
          WHEN pl_rade < 2 THEN '1-2'
          WHEN pl_rade < 4 THEN '2-4'
          WHEN pl_rade < 8 THEN '4-8'
          WHEN pl_rade < 16 THEN '8-16'
          ELSE '16+'
        END as range,
        COUNT(*) as value
      FROM exoplanets
      WHERE pl_rade IS NOT NULL
      GROUP BY range
      ORDER BY 
        CASE range
          WHEN '0-1' THEN 1
          WHEN '1-2' THEN 2
          WHEN '2-4' THEN 3
          WHEN '4-8' THEN 4
          WHEN '8-16' THEN 5
          ELSE 6
        END;
    `;
        const data = await runQuery(query);
        res.json(data.map(d => ({ range: d.range, value: Number(d.value) })));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/hot-jupiters', async (req, res) => {
    try {
        const query = `
      SELECT
          pl_name as name,
          hostname as host,
          ROUND(pl_orbper, 3) as period,
          ROUND(pl_rade, 2) as radius,
          ROUND(pl_eqt, 0) as temp
      FROM exoplanets
      WHERE pl_orbper < 10
        AND pl_rade > 8
      ORDER BY pl_orbper ASC
      LIMIT 10;
    `;
        const data = await runQuery(query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.use('/api/ml-outputs', express.static(path.resolve(process.cwd(), '../ml/outputs')));

app.get('/api/run-ml', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const mlProcess = spawn('python', ['-u', '../ml/run_ml.py'], { cwd: process.cwd() });

    res.write(`data: ${JSON.stringify({ type: 'start', msg: 'Starting ML Pipeline...' })}\n\n`);

    mlProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                res.write(`data: ${JSON.stringify({ type: 'log', msg: line })}\n\n`);
            }
        }
    });

    mlProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                res.write(`data: ${JSON.stringify({ type: 'log', msg: line, isError: true })}\n\n`);
            }
        }
    });

    mlProcess.on('close', (code) => {
        res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
        res.end();
    });
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});
