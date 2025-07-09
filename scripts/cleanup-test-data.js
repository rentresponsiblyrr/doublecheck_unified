#!/usr/bin/env node

/**
 * Cleanup Test Data for STR Certified Staging Environment
 * 
 * This script removes old test data to keep the staging environment clean
 * and prevent storage costs from accumulating.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  supabaseUrl: process.env.STAGING_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.STAGING_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  retentionDays: parseInt(process.env.VITE_STAGING_DATA_RETENTION_DAYS) || 30,
  batchSize: 100
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

async function cleanupOldData() {
  console.log('🧹 Starting cleanup of old test data...\n');
  
  try {
    const cutoffDate = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000);
    console.log(`📅 Cleaning up data older than ${cutoffDate.toISOString()}`);
    
    // Cleanup old inspections and related data
    console.log('🔍 Cleaning up old inspections...');
    const { data: oldInspections, error: inspectionError } = await supabase
      .from('inspections')
      .select('id')
      .lt('created_at', cutoffDate.toISOString());
    
    if (inspectionError) {
      console.error('Error fetching old inspections:', inspectionError);
      throw inspectionError;
    }
    
    if (oldInspections && oldInspections.length > 0) {
      console.log(`📋 Found ${oldInspections.length} old inspections to clean up`);
      
      // Clean up in batches
      const inspectionIds = oldInspections.map(i => i.id);
      for (let i = 0; i < inspectionIds.length; i += config.batchSize) {
        const batch = inspectionIds.slice(i, i + config.batchSize);
        
        // Delete related data first
        await supabase.from('auditor_feedback').delete().in('inspection_id', batch);
        await supabase.from('media_files').delete().in('inspection_id', batch);
        await supabase.from('checklist_items').delete().in('inspection_id', batch);
        await supabase.from('inspections').delete().in('id', batch);
        
        console.log(`✅ Cleaned up batch ${Math.floor(i / config.batchSize) + 1} of ${Math.ceil(inspectionIds.length / config.batchSize)}`);
      }
    } else {
      console.log('✅ No old inspections found');
    }
    
    // Cleanup old media files in storage
    console.log('🖼️  Cleaning up old media files...');
    const { data: oldMedia, error: mediaError } = await supabase
      .storage
      .from('inspection-media')
      .list('', {
        limit: 1000,
        offset: 0
      });
    
    if (mediaError) {
      console.warn('⚠️  Warning cleaning up media files:', mediaError.message);
    } else if (oldMedia && oldMedia.length > 0) {
      const oldMediaFiles = oldMedia.filter(file => {
        const fileDate = new Date(file.updated_at || file.created_at);
        return fileDate < cutoffDate;
      });
      
      if (oldMediaFiles.length > 0) {
        console.log(`📁 Found ${oldMediaFiles.length} old media files to clean up`);
        
        const filesToDelete = oldMediaFiles.map(file => file.name);
        for (let i = 0; i < filesToDelete.length; i += config.batchSize) {
          const batch = filesToDelete.slice(i, i + config.batchSize);
          
          const { error: deleteError } = await supabase
            .storage
            .from('inspection-media')
            .remove(batch);
          
          if (deleteError) {
            console.warn(`⚠️  Warning deleting media batch: ${deleteError.message}`);
          } else {
            console.log(`✅ Deleted media batch ${Math.floor(i / config.batchSize) + 1} of ${Math.ceil(filesToDelete.length / config.batchSize)}`);
          }
        }
      } else {
        console.log('✅ No old media files found');
      }
    }
    
    // Cleanup old RAG query logs
    console.log('📊 Cleaning up old RAG query logs...');
    const { error: ragError } = await supabase
      .from('rag_query_log')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (ragError) {
      console.warn('⚠️  Warning cleaning up RAG logs:', ragError.message);
    } else {
      console.log('✅ Cleaned up old RAG query logs');
    }
    
    // Cleanup old learning metrics
    console.log('📈 Cleaning up old learning metrics...');
    const { error: metricsError } = await supabase
      .from('learning_metrics')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (metricsError) {
      console.warn('⚠️  Warning cleaning up learning metrics:', metricsError.message);
    } else {
      console.log('✅ Cleaned up old learning metrics');
    }
    
    // Cleanup processed auditor feedback (keep recent for analysis)
    console.log('🔍 Cleaning up processed auditor feedback...');
    const { error: feedbackError } = await supabase
      .from('auditor_feedback')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('processed', true);
    
    if (feedbackError) {
      console.warn('⚠️  Warning cleaning up auditor feedback:', feedbackError.message);
    } else {
      console.log('✅ Cleaned up processed auditor feedback');
    }
    
    // Database maintenance
    console.log('🔧 Running database maintenance...');
    await runDatabaseMaintenance();
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`📊 Retained data from the last ${config.retentionDays} days`);
    console.log('💾 Storage space has been freed up');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

async function runDatabaseMaintenance() {
  try {
    // Get database statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_table_stats');
    
    if (statsError) {
      console.warn('⚠️  Could not get database statistics:', statsError.message);
    } else if (stats) {
      console.log('📊 Database statistics:');
      for (const stat of stats) {
        console.log(`   ${stat.table_name}: ${stat.row_count} rows`);
      }
    }
    
    // Run VACUUM on important tables (if using self-hosted Postgres)
    if (process.env.STAGING_SELF_HOSTED_DB === 'true') {
      console.log('🔧 Running VACUUM on tables...');
      const tables = ['inspections', 'checklist_items', 'media_files', 'auditor_feedback'];
      
      for (const table of tables) {
        const { error: vacuumError } = await supabase
          .rpc('vacuum_table', { table_name: table });
        
        if (vacuumError) {
          console.warn(`⚠️  Could not VACUUM ${table}:`, vacuumError.message);
        } else {
          console.log(`✅ VACUUM completed for ${table}`);
        }
      }
    }
    
    console.log('✅ Database maintenance completed');
    
  } catch (error) {
    console.warn('⚠️  Database maintenance warning:', error.message);
  }
}

async function getStorageUsage() {
  try {
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.warn('⚠️  Could not get storage usage:', bucketsError.message);
      return;
    }
    
    console.log('💾 Storage usage:');
    for (const bucket of buckets) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from(bucket.name)
        .list('', { limit: 1000 });
      
      if (filesError) {
        console.warn(`⚠️  Could not list files in ${bucket.name}:`, filesError.message);
        continue;
      }
      
      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      console.log(`   ${bucket.name}: ${files.length} files, ${sizeInMB} MB`);
    }
    
  } catch (error) {
    console.warn('⚠️  Storage usage warning:', error.message);
  }
}

// Force cleanup (removes all test data)
async function forceCleanup() {
  console.log('🚨 FORCE CLEANUP: Removing ALL test data...\n');
  
  try {
    // Delete all test data in dependency order
    const tables = [
      'auditor_feedback',
      'rag_query_log',
      'learning_metrics',
      'media_files',
      'checklist_items',
      'inspections',
      'properties',
      'knowledge_base'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.warn(`⚠️  Warning cleaning ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }
    
    // Clear all storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (buckets) {
      for (const bucket of buckets) {
        const { data: files } = await supabase
          .storage
          .from(bucket.name)
          .list('', { limit: 1000 });
        
        if (files && files.length > 0) {
          const filesToDelete = files.map(file => file.name);
          await supabase
            .storage
            .from(bucket.name)
            .remove(filesToDelete);
          
          console.log(`✅ Cleared ${bucket.name} storage`);
        }
      }
    }
    
    console.log('\n🎉 Force cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during force cleanup:', error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  // Validate configuration
  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('❌ Missing Supabase configuration. Please set STAGING_SUPABASE_URL and STAGING_SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  
  if (args.includes('--force')) {
    forceCleanup()
      .then(() => {
        console.log('\n✨ Force cleanup completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
      });
  } else if (args.includes('--stats')) {
    getStorageUsage()
      .then(() => {
        console.log('\n✨ Storage statistics completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
      });
  } else {
    cleanupOldData()
      .then(() => {
        console.log('\n✨ Cleanup completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  cleanupOldData,
  forceCleanup,
  getStorageUsage
};